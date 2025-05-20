# VgridJS - DGGS Visualization on MapLibre GL JS

## Basic Usage
```html
<!DOCTYPE html>
<html>

<head>
    <title>VgridJS Example</title>
    <script src="https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.js"></script>
    <link href="https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.css" rel="stylesheet" />
    <style>
        body {
            margin: 0;
            padding: 0;
        }

        #map {
            width: 100%;
            height: 100vh;
        }
    </style>
</head>

<body>
    <div id="map"></div>
    <script type="module">
        import H3Grid from "https://unpkg.com/vgridjs/H3/H3Grid.js";
        const map = new maplibregl.Map({
            container: 'map',
            style: 'https://raw.githubusercontent.com/thangqd/vstyles/main/vstyles/omt/fiord/fiord.json',
            center: [0, 0],
            zoom: 0
        });

        map.on('load', () => {
            const h3Grid = new H3Grid(map, {
                color: 'rgba(255, 0, 0, 1)',
                width: 1.5,
                redraw: 'move',
            });
        });
    </script>
</body>

</html>
```

## H3 
<iframe src="https://thangqd.github.io/pages/dggs/h3/" width="100%" height="600px" frameborder="0"></iframe>

## S2 	
<iframe src="https://thangqd.github.io/pages/dggs/s2/" width="100%" height="600px" frameborder="0"></iframe>

## A5 	
<iframe src="https://thangqd.github.io/pages/dggs/a5/" width="100%" height="600px" frameborder="0"></iframe>

## QTM 	
<iframe src="https://thangqd.github.io/pages/dggs/qtm/" width="100%" height="600px" frameborder="0"></iframe>

## OLC (OpenLocationCode/ Google Pluscode) 	
<iframe src="https://thangqd.github.io/pages/dggs/olc/" width="100%" height="600px" frameborder="0"></iframe>

## Geohash 
<iframe src="https://thangqd.github.io/pages/dggs/geohash/" width="100%" height="600px" frameborder="0"></iframe>

## GEOREF 
<iframe src="https://thangqd.github.io/pages/dggs/georef/" width="100%" height="600px" frameborder="0"></iframe>

## MGRS	
<iframe src="https://thangqd.github.io/pages/dggs/mgrs/" width="100%" height="600px" frameborder="0"></iframe>

## Tilecode	
<iframe src="https://thangqd.github.io/pages/dggs/tilecode/" width="100%" height="600px" frameborder="0"></iframe>

## Maidenhead 	
<iframe src="https://thangqd.github.io/pages/dggs/maidenhead/" width="100%" height="600px" frameborder="0"></iframe>

## GARS 
<iframe src="https://thangqd.github.io/pages/dggs/gars/" width="100%" height="600px" frameborder="0"></iframe>