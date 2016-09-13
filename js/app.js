(function() {
    var width = 900;
    var height = 600;
    var centered = null;
    var path = null;
    var g = null;
    var projection = null;
    var selected_province = null;
    var municipalities = [];

    function region_clicked(d) {
        var x, y, k;
        if (d && centered !== d) {
            var centroid = path.centroid(d);
            x = centroid[0];
            y = centroid[1];
            k = 2.5;
            centered = d;
            zoom_in(d.properties.nuts3, k, x, y);
        } else {
            x = width / 2;
            y = height / 2;
            k = 1;
            centered = null;

            zoom_out();
        }

        
    } 

    function zoom_in(province, k, x, y) {
        if(selected_province) {
            d3.selectAll('.village.' + selected_province).classed('visible', false);
            zoom_out();
            
            return ;
        }

        selected_province = province;
        d3.selectAll('.town').classed('visible', false);
        d3.selectAll('.village.' + province).classed('visible', true);
        d3.selectAll('.stats').classed('hidden', true);

        g.transition()
            .duration(750)
            .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")");
    }

    function zoom_out() {
        d3.selectAll('.municipality.show')
                    .classed('show', false);
        d3.selectAll('.village.' + selected_province).classed('visible', false);
        d3.selectAll('.stats').classed('hidden', false);

        selected_province = null;
        g.transition()
            .duration(750)
            .attr("transform", "translate(0,0)");
    }

    function load_provinces() {
        d3.json("geojson/provinces.json", function(json) {
            // create a first guess for the projection
            center = d3.geo.centroid(json)
            var scale = 120;
            var offset = [width / 2, height / 2];
            projection = d3.geo.mercator().scale(scale).center(
                    center)
                .translate(offset);

            // create the path
            path = d3.geo.path().projection(projection);

            // using the path determine the bounds of the current map and use 
            //  these to determine better values for the scale and translation
            var bounds = path.bounds(json);
            var hscale = scale * width / (bounds[1][0] - bounds[0][0]);
            var vscale = scale * height / (bounds[1][1] - bounds[0][1]);
            var scale = (hscale < vscale) ? hscale : vscale;
            var offset = [width - (bounds[0][0] + bounds[1][0]) / 2,
                height - (bounds[0][1] + bounds[1][1]) / 2
            ];

            // new projection
            projection = d3.geo.mercator().center(center)
                .scale(scale).translate(offset);
            path = path.projection(projection);

            g.selectAll("path")
                .data(json.features).enter()
                .append('g')
                .attr('id', function(d){ 
                    return d.properties.nuts3; 
                })
                .on('click', function(d) {
                    if(['SHU', 'VAR', 'BGS'].indexOf(d.properties.nuts3) === -1) {
                        zoom_out();
                        return ;
                    }

                    d3.selectAll('.municipality.show')
                        .classed('show', false);
                    
                    d3.selectAll('.nuts-' + d.properties.nuts3)
                        .attr('class', 'municipality show nuts-' + d.properties.nuts3);

                    region_clicked(d); 
                })
                .attr('class', 'province')
                .append(
                    "path")
                .attr("d", path)
                .style("stroke-width", "1")
                .style("stroke", "#3d322a")
                .attr('fill', function(d) {
                    if(['SHU', 'VAR', 'BGS'].indexOf(d.properties.nuts3) > -1) {
                        return '#b7c798';
                    }
                    return 'rgba(255,255,255,.45)'; 
                });

            load_places();    
            load_stats();
        });
    }

    function load_municipalities() {
        d3.json("geojson/municipalities.json?1", function(json) {
            // create a first guess for the projection
            var center = d3.geo.centroid(json)
            var scale = 120;
            var offset = [width / 2, height / 2];
            var projection = d3.geo.mercator().scale(scale).center(
                    center)
                .translate(offset);

            // create the path
            var path = d3.geo.path().projection(projection);

            // using the path determine the bounds of the current map and use 
            //  these to determine better values for the scale and translation
            var bounds = path.bounds(json);
            var hscale = scale * width / (bounds[1][0] - bounds[0][0]);
            var vscale = scale * height / (bounds[1][1] - bounds[0][1]);
            var scale = (hscale < vscale) ? hscale : vscale;
            var offset = [width - (bounds[0][0] + bounds[1][0]) / 2,
                height - (bounds[0][1] + bounds[1][1]) / 2
            ];

            // new projection
            projection = d3.geo.mercator().center(center)
                .scale(scale).translate(offset);
            path = path.projection(projection);
            json.features.forEach(function(f) {
                if(f.properties.nuts4 === 'SHU23') {
                    console.log('whhaaat', f);
                }
            });

            g.selectAll("text").data(json.features).enter()
                .append('g')
                .attr('id', function(d){
                    return d.properties.nuts4; 
                })
                .attr('class', function(d) {
                    return 'municipality nuts-' + d.properties.nuts3; 
                })
                .append(
                    "path")
                .attr("d", path)
                .style("stroke-width", "1")
                .style("stroke", "rgba(61, 50, 42, 0.3)")
                .attr('fill', 'rgba(255,255,255,.45)');
        });
    }

    function load_places() {
        d3.json("geojson/places.json?5", function(json) {
            json.forEach(function(place) {
                if(place.village) {
                    municipalities.push(place.municipality_code);
                }

                var geo = place.geo.split(',');
                var placeGroup = g.append('g');
                
                placeGroup
                    .attr('id', place.ekatte)
                    .attr("class", function(d) {
                        if(place.village === 0) {
                            return 'town';
                        }

                        if(place.village === 1) {
                            return 'village ' + place.province;
                        }
                    });
                
                placeGroup
                    .append('circle')
                    .attr("r", function() {
                        if(place.village === 0) {
                            return 5;
                        }

                        if(place.village === 1) {
                            return 3;
                        }
                    })
                    .attr('fill', '#3d322a')
                    .attr('opacity', function() { 
                        if(place.village === 0) {
                            return 0.8;
                        }

                        return 0.8;
                    })
                    .attr("transform", function() {
                        return "translate(" + projection([parseFloat(geo[0]), parseFloat(geo[1])]) + ")";
                    });

                placeGroup
                    .append('text')
                    .text(place.name)
                    .attr('fill', '#3d322a')
                    .attr('font-size', function() {
                        if(place.village === 0) {
                            return 16; 
                        }
                        
                        return 8;
                    })
                    .attr('x', function() {
                        if(place.name === 'Рудник' || place.name === 'Господиново') {
                            return 5;
                        }
                        return -this.getBBox().width/2; 
                    })
                    .attr('y', function() {
                        if(place.name === 'Рудник' || place.name === 'Господиново') {
                            return 3;
                        }
                        
                        if(place.name === 'Старо Оряхово') {
                            return -this.getBBox().height/2 + 2;
                        }

                        return -this.getBBox().height/2; 
                    })
                    .attr("transform", function() {
                        var x = parseFloat(geo[0]);
                        var y = parseFloat(geo[1]);
                        return "translate(" + projection([x,y]) + ")";
                    });
            });
        });

    }

    function load_stats() {
        var shuBox = d3.select('#SHU')[0][0].getBBox(); 
        var varBox = d3.select('#VAR')[0][0].getBBox(); 
        var bgsBox = d3.select('#BGS')[0][0].getBBox(); 
        
        var gShu = g.append('g')
            .attr('id', 'SHU-stats')
            .attr('x', 0)
            .attr('y', 0)
            .attr('transform', 'translate(' + (shuBox.x + shuBox.width/2) + ',' + (shuBox.y + shuBox.height/2) + ')')
            .attr('class', 'stats');
        
        var gVar = g.append('g')
            .attr('id', 'VAR-stats')
            .attr('x', 0)
            .attr('y', 0)
            .attr('transform', 'translate(' + (varBox.x + varBox.width/2) + ',' + (varBox.y + varBox.height/2) + ')')
            .attr('class', 'stats');

        var gBgs = g.append('g')
            .attr('id', 'BGS-stats')
            .attr('x', 0)
            .attr('y', 0)
            .attr('transform', 'translate(' + (bgsBox.x + bgsBox.width/2) + ',' + (bgsBox.y + bgsBox.height/2) + ')')
            .attr('class', 'stats');

        gShu.append('circle')
            .attr('x', 0)
            .attr('y', 0)
            .attr('r', 50)
            .attr('fill', '#3d322a')
            .attr('opacity', 0.4);

        gShu.append('text')
            .text('Шумен')
            .attr('fill', '#fff')
            .attr('x', function() {
                return -this.getBBox().width/2; 
            })
            .attr('y', function() {
                return -this.getBBox().height/2; 
            });
        
        gShu.append('text')
            .text('323')
            .attr('fill', '#fff')
            .attr('font-size', 24)
            .attr('x', function() {
                return -this.getBBox().width/2; 
            })
            .attr('y', function() {
                return -this.getBBox().height/2 + 35; 
            });

        gVar.append('circle')
            .attr('x', 0)
            .attr('y', 0)
            .attr('r', 50)
            .attr('fill', '#3d322a')
            .attr('opacity', 0.4);
        
        gVar.append('text')
            .text('Варна')
            .attr('fill', '#fff')
            .attr('x', function() {
                return -this.getBBox().width/2; 
            })
            .attr('y', function() {
                return -this.getBBox().height/2; 
            });
        
        gVar.append('text')
            .text('576')
            .attr('fill', '#fff')
            .attr('font-size', 24)
            .attr('x', function() {
                return -this.getBBox().width/2; 
            })
            .attr('y', function() {
                return -this.getBBox().height/2 + 35; 
            });

        gBgs.append('circle')
            .attr('x', 0)
            .attr('y', 0)
            .attr('r', 50)
            .attr('fill', '#3d322a')
            .attr('opacity', 0.4);
        
        gBgs.append('text')
            .text('Бургас')
            .attr('fill', '#fff')
            .attr('x', function() {
                return -this.getBBox().width/2; 
            })
            .attr('y', function() {
                return -this.getBBox().height/2; 
            });
        
        gBgs.append('text')
            .text('228')
            .attr('fill', '#fff')
            .attr('font-size', 24)
            .attr('x', function() {
                return -this.getBBox().width/2; 
            })
            .attr('y', function() {
                return -this.getBBox().height/2 + 35; 
            });

    }

    function bind_notes() {
    }

    function mark_municipalities() {
        municipalities.forEach(function(m) {
            console.log(m);
            d3.selectAll('#' + m + ' > path').
                attr('fill', '#7c9944')
        });
    }

    function init() {
        var vis = d3.select("#map-container").append("svg")
            .attr("width", width).attr("height", height).attr('viewBox', '36 0 900 600');

        g = vis.append('g');

        load_provinces();
        load_municipalities();

        setTimeout(function() {
            mark_municipalities();
        }, 1000);
    }

    init();
} ())
