class A5Grid {
  constructor(map, options = {}) {
    this.map = map;
    this.latitudeMax = 90;
    this.latitudeMin = -this.latitudeMax;
    this.longitudeMax = 180;
    this.longitudeMin = -this.longitudeMax;
    this.extraFillArea = 0.5;
    this.options = {
      redraw: options.redraw || 'move', // Default to redraw on move
    };
    this.sourceId = 'a5-grid';
    this.gridLayerId = 'a5-grid-layer';
    this.labelLayerId = 'a5-label-layer';
    this.initialize();
  }

  initialize() {
    // Add a GeoJSON source for the grid
    this.map.addSource(this.sourceId, {
      type: 'geojson',
      data: this.generateGrid(),
    });

    this.map.addLayer({
      id: this.gridLayerId,
      source: this.sourceId,
      type: 'fill',
      layout: {},
      paint: {
        'fill-color': 'transparent',
        'fill-opacity': 1,
        'fill-outline-color': ['get', 'color'],
      }
    });

    // Redraw the grid on map movements
    this.map.on(this.options.redraw, () => this.updateGrid());
  }

  updateGrid() {
    const newGrid = this.generateGrid();
    const source = this.map.getSource(this.sourceId);
    if (source) {
      source.setData(newGrid);
    }
  }

  // Placeholder for determining A5 grid resolution based on zoom
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

  // Render A5 grid based on current map zoom
  generateGrid() {
    const latitudeMax = 90;
    const latitudeMin = -latitudeMax;
    const longitudeMax = 180;
    const longitudeMin = -longitudeMax;

    const extraFillArea = 0.5;
    const gridLayer = 'grid-layer';
    const gridSource = 'grid-source';
    const gridLabelLayer = 'grid-label';

    var currentZoom = this.map.getZoom();
    var a5Res = this.getResolution(currentZoom);

    const iw = window.innerWidth;
    const ih = window.innerHeight;
    const cUL = this.map.unproject([0, 0]).toArray(); // Upper left
    const cLR = this.map.unproject([iw, ih]).toArray(); // Lower right
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

    // A5 grid generation logic (replace with actual logic)
    var shapes = [].concat(...coordinates.map(e => this.generateA5Cells(e, a5Res)));
    var features = [];

    for (var i = 0; i < shapes.length; i++) {
      let cellId = shapes[i];
      let boundary = this.getA5CellBoundary(cellId);

      let featuresData = {
        "type": "Feature",
        "properties": {
          "color": 'blue',  // Placeholder color
          "cellId": cellId,
          "resolution": a5Res,
        },
        "geometry": {
          "type": "Polygon",
          "coordinates": [boundary]
        }
      };

      features.push(featuresData);
    }

    const geojson_features = {
      type: "FeatureCollection",
      features,
    };

    return geojson_features;
  }

  // Placeholder function to generate A5 cells, replace with actual A5 logic
  generateA5Cells(coordinate, resolution) {
    // Implement A5 grid generation here
    return [coordinate]; // Return a mock array of coordinates
  }

  // Placeholder function to get boundary of A5 cell
  getA5CellBoundary(cellId) {
    // Implement boundary generation for A5 cell here
    return [[-90, -180], [-90, 0], [0, 0], [0, -180]];  // Placeholder coordinates
  }
}

export default A5Grid;
