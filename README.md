<p align="center">
  <strong >vgrid-maplibre </strong> <br>
    <b><i>DGGS Visualization in MapLibre and Mapbox GL JS</i><b>
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

#### vgrid-maplibre can be used with both MapLibre and Mapbox GL JS to interactively visualize a wide range of DGGS, including geodesic DGGS such as H3, S2, A5, DGGAL, and QTM, as well as graticule-based DGGS like OLC, Geohash, GEOREF, MGRS, Tilecode (by Vigrid), Maidenhead, GARS, and India DIGIPIN.

### Basic usage (for H3 as an example)
```html
<!DOCTYPE html>
<html>

<head>
    <title>vgrid-maplibre Demo</title>
    <script src="https://unpkg.com/maplibre-gl@lates/dist/maplibre-gl.js"></script>
    <link href="https://unpkg.com/maplibre-gl@latest/dist/maplibre-gl.css" rel="stylesheet" />
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
            style: 'https://raw.githubusercontent.com/opengeoshub/vstyles/main/vstyles/omt/fiord/fiord.json',
            center: [0, 0],
            zoom: 0
        });

        map.on('load', () => {
            const h3Grid = new H3Grid(map, {
                color: 'rgba(255, 0, 0, 1)',
                width: 1.5,
                redraw: 'moveend',
            });
        });
    </script>
</body>

</html>
```

### H3 
[H3 in MapLibre](https://gishub.vn/pages/dggs/h3/)

![image](https://github.com/user-attachments/assets/00d27bea-523b-4d89-abf2-a1809dcffd12)

[H3 in Mapbox](https://gishub.vn/pages/dggs/h3/mapbox.html)

<img width="2880" height="1466" alt="image" src="https://github.com/user-attachments/assets/50b605ab-c471-414b-91d3-909cfb9e2fc7" />


### S2 	
[S2 in MapLibre](https://gishub.vn/pages/dggs/s2/)

<img width="2862" height="1470" alt="image" src="https://github.com/user-attachments/assets/79fe26f2-58c8-4642-8071-c62b0d21633e" />

### A5 	
[A5 in MapLibre](https://gishub.vn/pages/dggs/a5/)

<img width="2880" height="1460" alt="image" src="https://github.com/user-attachments/assets/426e1033-4623-4b15-a793-d03dac439a92" />

### DGGAL 	
```javascript
// Initialize a DGGAL grid by specifying the desired DGGS type
// Available options include:
// 'GNOSISGlobalGrid', 'ISEA4R', 'ISEA9R', 'ISEA3H', 'ISEA7H', 'ISEA7H_Z7',
// 'IVEA4R', 'IVEA9R', 'IVEA3H', 'IVEA7H', 'IVEA7H_Z7',
// 'RTEA4R', 'RTEA9R', 'RTEA3H', 'RTEA7H', 'RTEA7H_Z7',
// 'HEALPix', 'rHEALPix'

const dggalGrid = new DGGALGrid(
    <dggs_type>,
    map,
    {
        color: 'rgba(255, 0, 0, 1)',
        width: 1.5,
        redraw: 'moveend',
    }
);
```

[DGGAL IVEA7H_Z7 in MapLibre](https://gishub.vn/pages/dggs/dggal/)

<img width="2880" height="1468" alt="image" src="https://github.com/user-attachments/assets/e9fde5ba-b429-4f3c-acb9-ad26458b1317" />

### QTM 	
[QTM in MapLibre](https://gishub.vn/pages/dggs/qtm/)

<img width="2880" height="1472" alt="image" src="https://github.com/user-attachments/assets/4d773b02-d7a3-42ad-a090-7519e835f397" />


### OLC (OpenLocationCode/ Google Pluscode) 	
[OLC in MapLibre](https://gishub.vn/pages/dggs/olc/)

<img width="2880" height="1462" alt="image" src="https://github.com/user-attachments/assets/99a55563-ef0d-4989-96f9-ce8a1a8cb95a" />


### Geohash 
[Geohash in MapLibre](https://gishub.vn/pages/dggs/geohash/)

![image](https://github.com/user-attachments/assets/7d3b320b-e650-407d-9605-e162dae1a6ca)

### GEOREF 
[GEOREF in MapLibre](https://gishub.vn/pages/dggs/georef/)

![image](https://github.com/user-attachments/assets/c4ee4c02-e531-48f3-b618-5c3d7b4c9d00)

### MGRS	
[MGRS in MapLibre](https://gishub.vn/pages/dggs/mgrs/)

![image](https://github.com/user-attachments/assets/e9b9cd46-4690-4f33-8bff-7dc32d154f78)

### Vgrid Tilecode	
[Vgrid Tilecode in MapLibre](https://gishub.vn/pages/dggs/tilecode/)

<img width="2880" height="1468" alt="image" src="https://github.com/user-attachments/assets/20cccd9f-e746-4f49-85e6-d22194e4993f" />


### Maidenhead 	
[Maidenhead in MapLibre](https://gishub.vn/pages/dggs/maidenhead/)

![image](https://github.com/user-attachments/assets/0015c444-17ca-4a4f-81bf-bd67197506d5)

### GARS 
[GARS in MapLibre](https://gishub.vn/pages/dggs/gars/)

![image](https://github.com/user-attachments/assets/cb9a43f6-52be-46c9-a670-509884903f68)

### India DIGIPIN 
[India DIGIPIN Demo](https://gishub.vn/pages/dggs/digipin/)

![image](https://github.com/user-attachments/assets/d418ac9e-7639-4a11-8f71-86118e5820bd)

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

