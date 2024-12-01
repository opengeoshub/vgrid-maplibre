class H3Grid {
  constructor(map) {
    this.map = map;
    this.latitudeMax = 90;
    this.latitudeMin = -this.latitudeMax;
    this.longitudeMax = 180;
    this.longitudeMin = -this.longitudeMax;
    this.extraFillArea = 0.5;
    this.hexLayer = 'hex-layer';
    this.hexSource = 'hex-source';
    this.hexLabelLayer = 'hex-label';
  }

  // Determine the H3 resolution based on zoom level
  getResolution(zoom) {
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

  // Render hexagons based on current map zoom
  renderHexes() {
    const currentZoom = this.map.getZoom();
    const h3res = this.getResolution(currentZoom);

    const iw = window.innerWidth;
    const ih = window.innerHeight;
    const cUL = this.map.unproject([0, 0]).toArray(); // Upper left
    const cLR = this.map.unproject([iw, ih]).toArray(); // Lower right

    let x1 = Math.min(cUL[0], cLR[0]);
    let x2 = Math.max(cUL[0], cLR[0]);
    let y1 = Math.min(cUL[1], cLR[1]);
    let y2 = Math.max(cUL[1], cLR[1]);

    let dh = x2 - x1;
    let dv = y2 - y1;

    let x1withBuffer = x1 - dh * this.extraFillArea;
    let x2withBuffer = x2 + dh * this.extraFillArea;
    let y1withBuffer = y1 - dv * this.extraFillArea;
    let y2withBuffer = y2 + dv * this.extraFillArea;

    x1withBuffer = Math.max(x1withBuffer, this.longitudeMin);
    x2withBuffer = Math.min(x2withBuffer, this.longitudeMax);
    y1withBuffer = Math.max(y1withBuffer, this.latitudeMin);
    y2withBuffer = Math.min(y2withBuffer, this.latitudeMax);

    let coordinates = [];
    const xIncrement = 180;
    let lowerX = x1withBuffer;

    while (lowerX < this.longitudeMax && lowerX < x2withBuffer) {
      let upperX = Math.min(lowerX + xIncrement, x2withBuffer, 180);
      coordinates.push([
        [y2withBuffer, lowerX],
        [y2withBuffer, upperX],
        [y1withBuffer, upperX],
        [y1withBuffer, lowerX]
      ]);
      lowerX += xIncrement;
    }

    const shapes = [].concat(...coordinates.map(e => h3.polygonToCells(e, h3res)));
    const features = shapes.map(cellId => this.createFeature(cellId, h3res));

    const featureCollection = {
      type: "FeatureCollection",
      features: features
    };

    this.updateMap(featureCollection);
  }

  // Create a feature for each cell
  createFeature(cellId, h3res) {
    let boundary = h3.cellToBoundary(cellId, true);

    // Adjust boundary coordinates if they cross the anti-meridian
    if (boundary.find(e => e[0] < -128) !== undefined) {
      boundary = boundary.map(e => e[0] > 0 ? [e[0] - 360, e[1]] : e);
    }

    const precision = h3.getResolution(cellId);
    const edgeUnit = precision > 7 ? h3.UNITS.m : h3.UNITS.km;
    const areaUnit = precision > 7 ? h3.UNITS.m2 : h3.UNITS.km2;

    const icosaFaces = h3.getIcosahedronFaces(cellId);
    const avgEdgeLen = parseFloat(h3.getHexagonEdgeLengthAvg(h3res, edgeUnit).toFixed(1)).toLocaleString();
    let area = parseFloat(h3.cellArea(cellId, areaUnit).toFixed(1)).toLocaleString();
    const avgArea = parseFloat(h3.getHexagonAreaAvg(h3res, areaUnit).toFixed(1)).toLocaleString();
    const numHex = h3.getNumCells(h3res).toLocaleString();

    return {
      type: "Feature",
      properties: {
        color: h3.isPentagon(cellId) ? 'red' : 'blue',
        cellId,
        precision,
        icosaFaces,
        area,
        avgArea,
        areaUnit,
        avgEdgeLen,
        edgeUnit,
        numHex
      },
      geometry: {
        type: "Polygon",
        coordinates: [boundary]
      }
    };
  }

  // Update the map with the feature collection
  updateMap(featureCollection) {
    const hexSource = this.map.getSource(this.hexSource);
    if (hexSource !== undefined) {
      hexSource.setData(featureCollection);
    } else {
      const hexGeoJson = {
        type: 'geojson',
        data: featureCollection,
      };
      this.map.addSource(this.hexSource, hexGeoJson);
      this.addLayerToMap();
    }
  }

  // Add the hexagon layer to the map
  addLayerToMap() {
    this.map.addLayer({
      id: this.hexLayer,
      source: this.hexSource,
      type: 'fill',
      layout: {},
      paint: {
        'fill-color': 'transparent',
        'fill-opacity': 1,
        'fill-outline-color': ['get', 'color'],
      }
    });
  }
}
export default H3Grid;

// Usage example:
// const h3Grid = new H3Grid(map);
// h3Grid.renderHexes();
