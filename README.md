# VgridJS - DGGS Visualization on MapLibre GL JS

## Basic Usage (for H3 as an example)
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
[View H3 Demo](https://thangqd.github.io/pages/dggs/h3/)

## S2 	
[View S2 Demo](https://thangqd.github.io/pages/dggs/s2/)

## A5 	
[View A5 Demo](https://thangqd.github.io/pages/dggs/a5/)

## QTM 	
[View QTM Demo](https://thangqd.github.io/pages/dggs/qtm/)

## OLC (OpenLocationCode/ Google Pluscode) 	
[View OLC Demo](https://thangqd.github.io/pages/dggs/olc/)

## Geohash 
[View Geohash Demo](https://thangqd.github.io/pages/dggs/geohash/)

## GEOREF 
[View GEOREF Demo](https://thangqd.github.io/pages/dggs/georef/)

## MGRS	
[View MGRS Demo](https://thangqd.github.io/pages/dggs/mgrs/)

## Tilecode	
[View Tilecode Demo](https://thangqd.github.io/pages/dggs/tilecode/)

## Maidenhead 	
[View Maidenhead Demo](https://thangqd.github.io/pages/dggs/maidenhead/)

## GARS 
[View GARS Demo](https://thangqd.github.io/pages/dggs/gars/)