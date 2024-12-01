class S2Grid {
  constructor(map, options = {}) {
    this.map = map;
    this.level = 2;
    this.latitudeMax = 90;
    this.latitudeMin = -this.latitudeMax;
    this.longitudeMax = 180;
    this.longitudeMin = -this.longitudeMax;
    this.options = {
      color: options.color || 'rgba(255, 0, 0, 1)',
      redraw: options.redraw || 'move', // Default to redraw on move
    };
    this.sourceId = 's2-grid';
    this.gridLayerId = 's2-grid-layer';
    this.labelLayerId = 's2-label-layer';
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
        'fill-outline-color': this.options.color
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

  generateCell(lat, lng) {
    const latLng = S2.L.LatLng(lat, lng);
    console.log(latLng)
    s2_cell = S2.S2Cell.FromLatLng(latLng, this.level);
    return s2_cell
  }
  ;
  generateGrid(minLat, minLng, maxLat, maxLng) {
    const cells = [];
    const step = 1 / Math.pow(2, this.level); // Approximate step size based on level
    console.log(step)
    for (let lat = minLat; lat <= maxLat; lat += step) {
      for (let lng = minLng; lng <= maxLng; lng += step) {
        const cell = this.generateCell(lat, lng);
        console.log(cell)
        cells.push(cell);
      }
    }
    console.log(cells)
    const geojson_features = cells.map((cell) => {
      const vertices = this.getCellVertices(cell);
      console.log(vertices)
      return {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [vertices],
        },
        properties: {
          id: cell.id,
        },
      };
    });
    console.log(geojson_features)
    return geojson_features
  }

  /**
   * Get the vertices of an S2 cell as [lat, lng] coordinates.
   * @param {Object} cell S2Cell object.
   * @returns {Array} Array of [lat, lng] pairs.
   */
  getCellVertices(cell) {
    const vertices = [];
    for (let i = 0; i < 4; i++) {
      const xyz = S2.FaceUVToXYZ(cell.face, cell.getVertexUV(i));
      const latLng = S2.XYZToLatLng(xyz);
      vertices.push([latLng.lat, latLng.lng]);
    }
    // Close the polygon by repeating the first vertex
    vertices.push(vertices[0]);
    return vertices;
  }
}

export default S2Grid;