<p align="center">
  <strong >vgrid-maplibre </strong> <br>
    <b><i>DGGS Visualization on MapLibre GL JS</i><b>
</p>
<p align="center">
  <img src="https://raw.githubusercontent.com/opengeoshub/vgridtools/main/images/readme/dggs.png">
</p>


[![npm package](https://img.shields.io/npm/v/vgrid-maplibre)](https://www.npmjs.com/package/vgrid-maplibre)
![downloads](https://img.shields.io/npm/dm/vgrid-maplibre)
![total](https://img.shields.io/npm/dt/vgrid-maplibre)
[![image](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)


### [vgrid-maplibre on NPM](https://www.npmjs.com/package/vgrid-maplibre)
### [Vgrid Home](https://vgrid.vn)

### Basic usage (for H3 as an example)
```html
<!DOCTYPE html>
<html>

<head>
    <title>vgrid-maplibre Demo</title>
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
        import H3Grid from "https://unpkg.com/vgrid-maplibre/H3/H3Grid.js";
        const map = new maplibregl.Map({
            container: 'map',
            style: 'https://raw.githubusercontent.com/opengeohubs/vstyles/main/vstyles/sbr/eclipse/eclipse.json',
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

### H3 
[View H3 Demo](https://gishub.vn/pages/dggs/h3/)

![image](https://github.com/user-attachments/assets/00d27bea-523b-4d89-abf2-a1809dcffd12)

### S2 	
[View S2 Demo](https://gishub.vn/pages/dggs/s2/)

![image](https://github.com/user-attachments/assets/eeff51bf-16f0-4f45-ba2e-6b2fa6ddcb45)

### A5 	
[View A5 Demo](https://gishub.vn/pages/dggs/a5/)

![image](https://github.com/user-attachments/assets/c744df93-4374-4903-a47a-0ff752c744f6)

### QTM 	
[View QTM Demo](https://gishub.vn/pages/dggs/qtm/)

![image](https://github.com/user-attachments/assets/dd1fe259-d7f4-4bc7-8641-72ed433e65cf)

### OLC (OpenLocationCode/ Google Pluscode) 	
[View OLC Demo](https://gishub.vn/pages/dggs/olc/)

![image](https://github.com/user-attachments/assets/6f7e6da5-519f-4071-bacf-a4f328a0da86)

### Geohash 
[View Geohash Demo](https://gishub.vn/pages/dggs/geohash/)

![image](https://github.com/user-attachments/assets/7d3b320b-e650-407d-9605-e162dae1a6ca)

### GEOREF 
[View GEOREF Demo](https://gishub.vn/pages/dggs/georef/)

![image](https://github.com/user-attachments/assets/c4ee4c02-e531-48f3-b618-5c3d7b4c9d00)

### MGRS	
[View MGRS Demo](https://gishub.vn/pages/dggs/mgrs/)

![image](https://github.com/user-attachments/assets/e9b9cd46-4690-4f33-8bff-7dc32d154f78)

### Tilecode	
[View Tilecode Demo](https://gishub.vn/pages/dggs/tilecode/)

![image](https://github.com/user-attachments/assets/31aa45c1-df0f-4463-a3a1-5990c309aadd)

### Maidenhead 	
[View Maidenhead Demo](https://gishub.vn/pages/dggs/maidenhead/)

![image](https://github.com/user-attachments/assets/0015c444-17ca-4a4f-81bf-bd67197506d5)

### GARS 
[View GARS Demo](https://gishub.vn/pages/dggs/gars/)
=======
## H3 
[View H3 Demo](https://opengeoshub.github.io/pages/dggs/h3/)

![image](https://github.com/user-attachments/assets/00d27bea-523b-4d89-abf2-a1809dcffd12)

## S2 	
[View S2 Demo](https://opengeoshub.github.io/pages/dggs/s2/)

![image](https://github.com/user-attachments/assets/eeff51bf-16f0-4f45-ba2e-6b2fa6ddcb45)

## A5 	
[View A5 Demo](https://opengeoshub.github.io/pages/dggs/a5/)

![image](https://github.com/user-attachments/assets/c744df93-4374-4903-a47a-0ff752c744f6)

## QTM 	
[View QTM Demo](https://opengeoshub.github.io/pages/dggs/qtm/)

![image](https://github.com/user-attachments/assets/dd1fe259-d7f4-4bc7-8641-72ed433e65cf)

## OLC (OpenLocationCode/ Google Pluscode) 	
[View OLC Demo](https://opengeoshub.github.io/pages/dggs/olc/)

![image](https://github.com/user-attachments/assets/6f7e6da5-519f-4071-bacf-a4f328a0da86)

## Geohash 
[View Geohash Demo](https://opengeoshub.github.io/pages/dggs/geohash/)

![image](https://github.com/user-attachments/assets/7d3b320b-e650-407d-9605-e162dae1a6ca)

## GEOREF 
[View GEOREF Demo](https://opengeoshub.github.io/pages/dggs/georef/)

![image](https://github.com/user-attachments/assets/c4ee4c02-e531-48f3-b618-5c3d7b4c9d00)

## MGRS	
[View MGRS Demo](https://opengeoshub.github.io/pages/dggs/mgrs/)

![image](https://github.com/user-attachments/assets/e9b9cd46-4690-4f33-8bff-7dc32d154f78)

## Tilecode	
[View Tilecode Demo](https://opengeoshub.github.io/pages/dggs/tilecode/)

![image](https://github.com/user-attachments/assets/31aa45c1-df0f-4463-a3a1-5990c309aadd)

## Maidenhead 	
[View Maidenhead Demo](https://opengeoshub.github.io/pages/dggs/maidenhead/)

![image](https://github.com/user-attachments/assets/0015c444-17ca-4a4f-81bf-bd67197506d5)

## GARS 
[View GARS Demo](https://opengeoshub.github.io/pages/dggs/gars/)
>>>>>>> Stashed changes

![image](https://github.com/user-attachments/assets/eed1ebe3-c487-4be5-aa96-08974f2c9798)
