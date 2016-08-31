# Bulgaria Interactive Map 
A sample SVG map loading Bulgaria geojson data and going between provinces, municipalities and towns.

## What is this about
Loads three layers of geojson data and draws them on the map:
    - provinces
    - municipalities
    - settlements

Based on mouse events adds certain interactions:
    - click on a province will show all municipalities in the selected provice and will deselect the previously selected province
    - hover should change color with animation


## How to run
Currently just a simple html page so you need to run a webserver in order to see it. Example:

```python -m SimpleHTTPServer 8000```
