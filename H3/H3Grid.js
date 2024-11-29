function getResolution(zoom) {
  if (zoom <= 3.0) return 0;
  if (zoom <= 4.4) return 1;
  if (zoom <= 5.7) return 2;
  if (zoom <= 7.1) return 3;
  if (zoom <= 8.4) return 4;
  if (zoom <= 9.8) return 5;
  if (zoom <= 11.4) return 6;
  if (zoom <= 12.7) return 7;
  if (zoom <= 14.1) return 8;
  if (zoom <= 15.5) return 9;
  if (zoom <= 16.8) return 10;
  if (zoom <= 18.2) return 11;
  if (zoom <= 19.5) return 12;
  if (zoom <= 21.1) return 13;
  if (zoom <= 21.9) return 14;
  return 15;
}

function renderHexes(map) {
  const latitudeMax = 90;
  const latitudeMin = -latitudeMax;
  const longitudeMax = 180;
  const longitudeMin = -longitudeMax;

  const extraFillArea = 0.5;
  const hexLayer = 'hex-layer';
  const hexSource = 'hex-source';
  const hexlabelLayer = 'hex-label';

  var currentZoom = map.getZoom();
  var h3res = getResolution(currentZoom);

  const iw = window.innerWidth;
  const ih = window.innerHeight;
  const cUL = map.unproject([0, 0]).toArray(); // Upper left
  const cLR = map.unproject([iw, ih]).toArray(); // Lower right
  const x1 = Math.min(cUL[0], cLR[0]);
  const x2 = Math.max(cUL[0], cLR[0]);
  const y1 = Math.min(cUL[1], cLR[1]);
  const y2 = Math.max(cUL[1], cLR[1]);
  const dh = x2 - x1;
  const dv = y2 - y1;

  let x1withBuffer = x1 - dh * extraFillArea;
  let x2withBuffer = x2 + dh * extraFillArea;
  let y1withBuffer = y1 - dv * extraFillArea;
  let y2withBuffer = y2 + dv * extraFillArea;

  x1withBuffer = Math.max(x1withBuffer, longitudeMin);
  x2withBuffer = Math.min(x2withBuffer, longitudeMax);
  y1withBuffer = Math.max(y1withBuffer, latitudeMin);
  y2withBuffer = Math.min(y2withBuffer, latitudeMax);

  let coordinates = [];
  const xIncrement = 180;
  let lowerX = x1withBuffer;

  while (lowerX < longitudeMax && lowerX < x2withBuffer) {
    let upperX = Math.min(lowerX + xIncrement, x2withBuffer, 180);
    coordinates.push([
      [y2withBuffer, lowerX],
      [y2withBuffer, upperX],
      [y1withBuffer, upperX],
      [y1withBuffer, lowerX]
    ]);
    lowerX += xIncrement;
  }

  var shapes = [].concat(...coordinates.map(e => h3.polygonToCells(e, h3res)));
  var features = [];

  for (var i = 0; i < shapes.length; i++) {
    let cellId = shapes[i];
    let boundary = h3.cellToBoundary(cellId, true);

    // Adjust boundary coordinates if they cross the anti-meridian
    if (boundary.find((e) => e[0] < -128) !== undefined) {
      boundary = boundary.map((e) => e[0] > 0 ? [e[0] - 360, e[1]] : e);
    }
    const precision = h3.getResolution(cellId);
    const edge_unit = precision > 7 ? h3.UNITS.m : h3.UNITS.km;
    const area_unit = precision > 7 ? h3.UNITS.m2 : h3.UNITS.km2;


    const icosa_faces = h3.getIcosahedronFaces(cellId);
    const edge = h3.originToDirectedEdges(cellId)[0]

    const edge_len = h3.edgeLength(edge,edge_unit);
    let  avg_edge_len = h3.getHexagonEdgeLengthAvg(h3res, edge_unit);
    avg_edge_len = parseFloat(avg_edge_len.toFixed(1)).toLocaleString();

    let  area = h3.cellArea(cellId, area_unit);
    area = parseFloat(area.toFixed(1)).toLocaleString();

    let  avg_area = h3.getHexagonAreaAvg(h3res, area_unit);
    avg_area = parseFloat(avg_area.toFixed(1)).toLocaleString();

    let  num_hex = h3.getNumCells(h3res);
    num_hex = num_hex.toLocaleString();

    features.push({
      "type": "Feature",
      "properties": {
        "color": h3.isPentagon(cellId) ? 'red' : 'blue',
        "cellId": cellId, // Include the cell ID as a property
        "precision": precision,
        "icosa_faces": icosa_faces,
        "area": area,
        "avg_area": avg_area,
        "area_unit": area_unit,
        // "edge_len": edge_len,
        "avg_edge_len": avg_edge_len,
        "edge_unit": edge_unit,
        "num_hex": num_hex
      },
      "geometry": {
        "type": "Polygon", // Ensure this is a polygon
        "coordinates": [boundary] // Set the boundary as the polygon's coordinates
      }
    });
  }

  var featureCollection = {
    "type": "FeatureCollection",
    "features": features
  };

  // if (map.getZoom() == 0) {
  //   saveGeoJSONToFile(featureCollection, 'h3_filtered_cells_precision_0.geojson')
  // }


  const hexsource = map.getSource(hexSource);
  if (hexsource !== undefined) {
    hexsource.setData(featureCollection);
  } else {
    var hexGeoJson = {
      type: 'geojson',
      data: featureCollection,
    };
    map.addSource(hexSource, hexGeoJson);

    // Add the polygon border layer
    map.addLayer({
      'id': hexLayer,
      'source': hexSource,
      // 'type': 'line',
      // 'layout': {},
      // 'paint': {
      //   'line-color': ['get', 'color'],
      //   'line-width': 2
      // }
      'type': 'fill',
      'layout': {},
      'paint': {
        'fill-color':'transparent',         // Fill color
        'fill-opacity': 1,             // Transparency
        'fill-outline-color': ['get', 'color'],
      }

    });

    // Add the label layer (optional)
      // map.addLayer({
      //   'id': hexlabelLayer,
      //   'source': hexSource,
      //   'type': 'symbol',
      //   'layout': {
      //     'text-field': ['get', 'cellId'], // Use the cellId property as the label
      //     'text-size': 12, // Adjust size as needed
      //     'text-offset': [0, 0.5], // Offset to avoid overlapping with borders
      //     'text-anchor': 'top'
      //   },
      //   'paint': {
      //     'text-color': '#FF0000', // Black text
      //   }
      // });
  
  }
}

function saveGeoJSONToFile(geoJSON, fileName) {
  const blob = new Blob([JSON.stringify(geoJSON, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// [
//     "UNITS",
//     "h3IndexToSplitLong",
//     "splitLongToH3Index",
//     "isValidCell",
//     "isPentagon",
//     "isResClassIII",
//     "getBaseCellNumber",
//     "getIcosahedronFaces",
//     "getResolution",
//     "latLngToCell",
//     "cellToLatLng",
//     "cellToBoundary",
//     "cellToParent",
//     "cellToChildren",
//     "cellToChildrenSize",
//     "cellToCenterChild",
//     "cellToChildPos",
//     "childPosToCell",
//     "gridDisk",
//     "gridDiskDistances",
//     "gridRingUnsafe",
//     "polygonToCells",
//     "cellsToMultiPolygon",
//     "compactCells",
//     "uncompactCells",
//     "areNeighborCells",
//     "cellsToDirectedEdge",
//     "getDirectedEdgeOrigin",
//     "getDirectedEdgeDestination",
//     "isValidDirectedEdge",
//     "directedEdgeToCells",
//     "originToDirectedEdges",
//     "directedEdgeToBoundary",
//     "gridDistance",
//     "gridPathCells",
//     "cellToLocalIj",
//     "localIjToCell",
//     "greatCircleDistance",
//     "cellArea",
//     "edgeLength",
//     "getHexagonAreaAvg",
//     "getHexagonEdgeLengthAvg",
//     "cellToVertex",
//     "cellToVertexes",
//     "vertexToLatLng",
//     "isValidVertex",
//     "getNumCells",
//     "getRes0Cells",
//     "getPentagons",
//     "degsToRads",
//     "radsToDegs"
// ]