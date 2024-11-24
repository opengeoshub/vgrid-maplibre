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
  const borderLayerName = 'hex-layer-border';
  const hexSourceName = 'hex-source';
  const labelLayerName = 'hex-layer-label';

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

    const centroid = h3.cellToLatLng(cellId);

    features.push({
      "type": "Feature",
      "properties": {
        "color": h3.isPentagon(cellId) ? 'red' : 'blue',
        "cellId": cellId, // Include the cell ID as a property
        "labelPosition": centroid // Store the centroid for labeling
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [boundary]
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

  const hexSource = map.getSource(hexSourceName);
  if (hexSource !== undefined) {
    hexSource.setData(featureCollection);
  } else {
    var hexGeoJson = {
      type: 'geojson',
      data: featureCollection,
    };
    map.addSource(hexSourceName, hexGeoJson);

    // Add the polygon border layer
    map.addLayer({
      'id': borderLayerName,
      'source': hexSourceName,
      'type': 'line',
      'layout': {},
      'paint': {
        'line-color': ['get', 'color'],
        'line-width': 2
      }
    });
    
    // Add the label layer
      // map.addLayer({
      //   'id': labelLayerName,
      //   'source': hexSourceName,
      //   'type': 'symbol',
      //   'layout': {
      //     'text-field': ['get', 'cellId'], // Use the cellId property as the label
      //     'text-size': 12, // Adjust size as needed
      //     'text-offset': [0, 0.5], // Offset to avoid overlapping with borders
      //     'text-anchor': 'top'
      //   },
      //   'paint': {
      //     'text-color': '#FF0000', // Black text
      //     // 'text-halo-color': '#ffffff', // White halo for visibility
      //     // 'text-halo-width': 1
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
// function renderHexes(map) {
//   const latitudeMax = 90;
//   const latitudeMin = -latitudeMax;
//   const longitudeMax = 180;
//   const longitudeMin = -longitudeMax;

//   const extraFillArea = 0.5;
//   const blueColor = '#0080ff';
//   const borderLayerName = 'hex-layer-border';
//   const hexSourceName = 'hex-source';

//   var currentZoom = map.getZoom();
//   var h3res = getResolution(currentZoom);
//   // console.log("Resolution: " + JSON.stringify(h3res));

//   var res0Cells = h3.getRes0Cells();
//   const excludeCells = [
//     '800dfffffffffff', '8017fffffffffff', '8023fffffffffff', '8033fffffffffff',
//     '8047fffffffffff', '805bfffffffffff', '8071fffffffffff', '807ffffffffffff',
//     '809bfffffffffff', '80bbfffffffffff', '80dbfffffffffff', '80ebfffffffffff',
//     '80edfffffffffff', '80f3fffffffffff', '8003fffffffffff', '8001fffffffffff',
//     '8003fffffffffff', '8005fffffffffff'
//   ];

//   // Exclude the specified cells
//   let hexagons = res0Cells.filter(cell => !excludeCells.includes(cell));
//   // let hexagons = res0Cells

//   let allChildCells = [];  // Initialize an array to store all child cells

//   // Iterate over the hexagons array correctly
//   for (let cell of hexagons) {
//     // Get the child cells for each hexagon cell
//     let child_cells = h3.cellToChildren(cell, h3res);
//     allChildCells.push(...child_cells); // Flatten the array
//   }
//   hexagons = allChildCells;
//   // console.log('allChildCells:', allChildCells);

//   // Convert H3 indices to GeoJSON features
//   let features = [];
//   for (let hex of hexagons) {
//     let boundary = h3.cellToBoundary(hex, true);
//     let color = h3.isPentagon(hex) ? 'red' : 'blue';

//     features.push({
//       "type": "Feature",
//       "properties": { 'color': color },
//       "geometry": {
//         "type": "Polygon",
//         "coordinates": [boundary]
//       }
//     });
//   }

//   // console.log(`currentZoom: ${currentZoom}, resolution: ${h3res}, hexagons: ${features.length}`);

//   var featureCollection = {
//     "type": "FeatureCollection",
//     "features": features
//   };

//   // if (h3res ==0)
//   // {
//   //   saveGeoJSONToFile(featureCollection, 'h3_filtered_cells_precision_0.geojson') 
//   // }
//   const hexSource = map.getSource(hexSourceName);
//   if (hexSource !== undefined) {
//     hexSource.setData(featureCollection);
//   } else {
//     var hexGeoJson = {
//       type: 'geojson',
//       data: featureCollection,
//     };
//     map.addSource(hexSourceName, hexGeoJson);
//     map.addLayer({
//       'id': borderLayerName,
//       'source': hexSourceName,
//       'type': 'line',
//       'layout': {},
//       'paint': {
//         'line-color': ['get', 'color'],
//         'line-width': 2
//       }
//     });
//   }
// }

