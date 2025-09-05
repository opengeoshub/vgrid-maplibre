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
            style: 'https://raw.githubusercontent.com/opengeoshub/vstyles/main/vstyles/sbr/eclipse/eclipse.json',
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
[H3 Demo](https://gishub.vn/pages/dggs/h3/)

![image](https://github.com/user-attachments/assets/00d27bea-523b-4d89-abf2-a1809dcffd12)

### S2 	
[S2 Demo](https://gishub.vn/pages/dggs/s2/)

![image](https://github.com/user-attachments/assets/eeff51bf-16f0-4f45-ba2e-6b2fa6ddcb45)

### A5 	
[A5 Demo](https://gishub.vn/pages/dggs/a5/)

![image](https://github.com/user-attachments/assets/c744df93-4374-4903-a47a-0ff752c744f6)

### QTM 	
[QTM Demo](https://gishub.vn/pages/dggs/qtm/)

![image](https://github.com/user-attachments/assets/dd1fe259-d7f4-4bc7-8641-72ed433e65cf)

### OLC (OpenLocationCode/ Google Pluscode) 	
[OLC Demo](https://gishub.vn/pages/dggs/olc/)

![image](https://github.com/user-attachments/assets/6f7e6da5-519f-4071-bacf-a4f328a0da86)

### Geohash 
[Geohash Demo](https://gishub.vn/pages/dggs/geohash/)

![image](https://github.com/user-attachments/assets/7d3b320b-e650-407d-9605-e162dae1a6ca)

### GEOREF 
[GEOREF Demo](https://gishub.vn/pages/dggs/georef/)

![image](https://github.com/user-attachments/assets/c4ee4c02-e531-48f3-b618-5c3d7b4c9d00)

### MGRS	
[MGRS Demo](https://gishub.vn/pages/dggs/mgrs/)

![image](https://github.com/user-attachments/assets/e9b9cd46-4690-4f33-8bff-7dc32d154f78)

### Tilecode	
[Tilecode Demo](https://gishub.vn/pages/dggs/tilecode/)

![image](https://github.com/user-attachments/assets/31aa45c1-df0f-4463-a3a1-5990c309aadd)

### Maidenhead 	
[Maidenhead Demo](https://gishub.vn/pages/dggs/maidenhead/)

![image](https://github.com/user-attachments/assets/0015c444-17ca-4a4f-81bf-bd67197506d5)

### GARS 
[GARS Demo](https://gishub.vn/pages/dggs/gars/)
![image](https://github.com/user-attachments/assets/cb9a43f6-52be-46c9-a670-509884903f68)

### DGGS Comparisions (contributed by [akre54](https://github.com/akre54))

Grid System Name | Authors/Origin | Primary Cell Shape | Hierarchical Structure/Resolution | Equal Area vs. Uniform Perception/Distortion Characteristics | Key Intended Uses/Applications
-- | -- | -- | -- | -- | --
[H3](https://h3geo.org/) | Uber | Hexagon (with 12 pentagons at base) | 16 levels (0-15), Aperture 7 (approximate subdivision), 64-bit integer IDs | Prioritizes uniform perception, reduced subjective distortion, better adjacency properties; approximate area preservation | Large-scale geospatial analytics, ride-sharing, logistics, location-based services, nearest-neighbor search, clustering, spatial joins, data aggregation, gradient smoothing
[S2](http://s2geometry.io/) | Google | Quadrilateral | 30 levels (0-30), Aperture 4 (exact subdivision), 64-bit integer IDs, Hilbert curve-based | Prioritizes exact containment; cells can appear distorted at higher latitudes on planar projections | Spherical geometry manipulation, spatial indexing, approximating regions, big data systems
[A5](https://a5geo.org) | Felix Palmer | Pentagon | Hierarchical (details on levels/aperture not specified in snippets) | Targets "exactly equal areas" and "higher accuracy and lower distortion" | Representing points, lines, polygons in unified cell format; combining datasets, aggregating data, direct global data comparison
[QTM](https://ntrs.nasa.gov/citations/20190033822) | Various researchers (e.g., Goodchild, Lee & Samet) | Triangle | Hierarchical, based on octahedron subdivision; various encoding schemes (e.g., Goodchild, LS, Quaternary) | Moderate geometric distortion, distortion larger than icosahedra-based systems | Global spatial data extraction, multi-resolution management, spatial hierarchical indexing, global navigation, global DEM generation, remote sensing data organization
[OLC (OpenLocationCode / Google Pluscode)](https://en.wikipedia.org/wiki/Open_Location_Code) | Google's Zürich engineering office (2014) | Rectangular | Hierarchical (longer codes = smaller areas), base 20 encoding, "+" delimiter after 8 digits, can be shortened | Cells are non-equal area; block width decreases with distance from equator | Concise, shareable address replacement, especially where formal street addresses are lacking; offline encoding/decoding
[Geohash](https://en.wikipedia.org/wiki/Geohash) | Gustavo Niemeyer (2008) | Rectangular | Hierarchical (precision by string length), Z-order curve, base 4 spatial index, truncation | Cells are non-equal area; physical size changes with latitude; lexicographical similarity does not guarantee spatial proximity | Unique identifier, representing point data in databases, quick-and-dirty proximity search
[GEOREF (World Geographic Reference System)](https://en.wikipedia.org/wiki/World_Geographic_Reference_System) | US military/aeronautical (post-WWII) | Rectangular | Hierarchical (15°, 1°, 1-minute, 0.1-minute, 0.01-minute quadrangles) | Based on latitude/longitude, thus non-equal area; simpler notation for air navigation | Aeronautical charts, air navigation, military/inter-service applications (rarely seen today)
[MGRS (Military Grid Reference System)](https://en.wikipedia.org/wiki/Military_Grid_Reference_System) | NATO militaries | Square | Hierarchical (Grid Zone Designator, 100,000-meter square ID, numerical location from 10km down to 1m) | Derived from UTM/UPS, thus non-equal area; defines square grid areas, truncation for precision changes | Geo-referencing, position reporting, situational awareness for land operations (US Armed Forces, NATO); area-centric counterpart to point-centric systems
Tilecode | (Ambiguous - looks to be based on [`{Z, X, Y}` tiles](https://en.wikipedia.org/wiki/Tiled_web_map)) | Rectangular | Hierarchical (quad tree) | Based on latitude/longitude, thus non-equal area; small error in distance calculation assuming spherical Earth especially at higher latitudes, where areas appear stretched. The physical size of a pixel or a tile changes with latitude | Most commonly used in Mapbox and other web-based maps
[Maidenhead Locator System](https://en.wikipedia.org/wiki/Maidenhead_Locator_System) | John Morris G4ANB (1980) | Rectangular | Hierarchical (fields, squares, subsquares, extended squares), alternating letters/digits, varying bases | Based on latitude/longitude, thus non-equal area; small error in distance calculation assuming spherical Earth | Amateur radio operators for succinct geographic coordinates, contests, communication over air (voice, Morse code)
[GARS (Global Area Reference System)](https://en.wikipedia.org/wiki/Global_Area_Reference_System) | National Geospatial-Intelligence Agency (NGA) | Rectangular | Hierarchical (30-minute cells, 15-minute quadrants, 5-minute areas) | Based on latitude/longitude, thus non-equal area; cell size diminishes toward poles | US DoD and emergency services for joint force situational awareness, air-to-ground coordination, search and rescue (SAR), disaster relief, battle-space management

