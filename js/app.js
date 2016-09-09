(function() {
    var width = 900;
    var height = 600;
    var centered = null;
    var path = null;
    var g = null;
    var projection = null;

    function region_clicked(d) {
        var x, y, k;
        if (d && centered !== d) {
            var centroid = path.centroid(d);
            x = centroid[0];
            y = centroid[1];
            k = 3.5;
            centered = d;

            zoom_in();
        } else {
            x = width / 2;
            y = height / 2;
            k = 1;
            centered = null;

            zoom_out();
        }

        g.transition()
            .duration(750)
            .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")")
            .style("stroke-width", 1.5 / k + "px");
    } 

    function zoom_in() {
        d3.selectAll('.town').classed('visible', false);
        d3.selectAll('.village').classed('visible', true);
    }

    function zoom_out() {
        d3.selectAll('.municipality.show')
                    .classed('show', false);
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
                    d3.selectAll('.municipality.show')
                        .classed('show', false);
                    
                    d3.selectAll('.nuts-' + d.properties.nuts3)
                        .attr('class', 'municipality show nuts-' + d.properties.nuts3);

                    region_clicked(d); //d3.select('#' + d.properties.nuts3 + ' > path'));
                })
                .attr('class', 'province')
                .append(
                    "path")
                .attr("d", path)
                .style("stroke-width", "1")
                .style("stroke", "#7c9944")
                .attr('fill', 'rgba(255,255,255,.45)');

            load_places();    
        });
    }

    function load_municipalities() {
        d3.json("geojson/municipalities.json", function(json) {
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

            g.selectAll("path").data(json.features).enter()
                .append('g')
                .attr('id', function(d){
                    return d.properties.nut4; 
                })
                .attr('class', function(d) {
                    return 'municipality nuts-' + d.properties.nuts3; 
                })
                .append(
                    "path")
                .attr("d", path)
                .style("stroke-width", "1")
                .style("stroke", "#7c9944")
                .attr('fill', 'rgba(255,255,255,.45)');
        });
    }

    function load_places() {
        d3.json("geojson/places.json?1", function(json) {
            json.forEach(function(place) {
                var geo = place.geo.split(',');
                var placeGroup = g.append('g');
                console.log(place);
                placeGroup.attr('id', place.municipality_code);    
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
                    .attr("transform", function() {
                        return "translate(" + projection([parseFloat(geo[0]), parseFloat(geo[1])]) + ")";
                    })
                    .attr("class", function(d) {
                        if(place.village === 0) {
                            return 'town visible';
                        }

                        if(place.village === 1) {
                            return 'village';
                        }
                    }); 
                placeGroup
                    .append('text')
                    .text(place.name)
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
                    })
                    .attr("class", function(d) {
                        if(place.village === 0) {
                            return 'town visible';
                        }

                        if(place.village === 1) {
                            return 'village';
                        }
                    }); 
            });
        });

    }

    function init() {
        var vis = d3.select("#map-container").append("svg")
            .attr("width", width).attr("height", height).attr('viewBox', '36 0 900 600');

        g = vis.append('g');

        load_provinces();
        load_municipalities();
    }

    init();
} ())
