import * as h3 from 'https://unpkg.com/h3-js/dist/h3-js.es.js'; 

class H3Grid {
  constructor(map, options = {}) {
    this.map = map;
    this.latitudeMax = 90;
    this.latitudeMin = -this.latitudeMax;
    this.longitudeMax = 180;
    this.longitudeMin = -this.longitudeMax;
    this.extraFillArea = 0.5;
    this.options = {
      color: options.color || 'rgba(255, 0, 0, 1)',
      width: options.width || 1,
      redraw: options.redraw || 'moveend', // Default to redraw on moveend
    };
    this.sourceId = 'h3-grid';
    this.gridLayerId = 'h3-grid-layer';

    this.initialize();
  }

  initialize() {
    if (!this.map.getSource(this.sourceId)) {
      this.map.addSource(this.sourceId, {
        type: 'geojson',
        data: this.generateGrid(),
      });
    }
  
    if (!this.map.getLayer(this.gridLayerId)) {
      this.map.addLayer({
        id: this.gridLayerId,
        source: this.sourceId,
        type: 'fill',
        layout: {},
        paint: {
          'fill-color': 'transparent',
          'fill-opacity': 1,
        }
      });
    }
  
    if (!this.map.getLayer('outline')) {
      this.map.addLayer({
        id: 'outline',
        type: 'line',
        source: this.sourceId,
        layout: {},
        paint: {
          'line-color': ['get', 'color'],
          'line-width': this.options.width,
        }
      });
    }
  
    if (!this._hasListener) {
      this.map.on(this.options.redraw, () => this.updateGrid());
      this._hasListener = true;
    }
  }
  
  updateGrid() {
    const newGrid = this.generateGrid();
    const source = this.map.getSource(this.sourceId);
    if (source) {
      source.setData(newGrid);
    }
  }

  show() {
    if (!this.map.getLayer(this.gridLayerId)) {
      this.map.addLayer({
        id: this.gridLayerId,
        source: this.sourceId,
        type: 'fill',
        layout: {},
        paint: {
          'fill-color': 'transparent',
          'fill-opacity': 1,
        },
      });
    }

    if (!this.map.getLayer('outline')) {
      this.map.addLayer({
        id: 'outline',
        type: 'line',
        source: this.sourceId,
        layout: {},
        paint: {
          'line-color': ['get', 'color'],
          'line-width': this.options.width,
        }
      });
    }
  }

  remove() {
    if (this.map.getLayer(this.gridLayerId)) {
      this.map.removeLayer(this.gridLayerId);
    }
    if (this.map.getLayer('outline')) {
      this.map.removeLayer('outline');
    }
  }

  // Determine the H3 resolution based on zoom level
  getResolution(zoom) {
    const min_res = 0;
    const max_res =15;
    const resolution = Math.min(max_res, Math.max(min_res, Math.floor((zoom-3)*0.8)));
    return resolution;
  }

  // Render hexagons based on current map zoom
  generateGrid() {
    var currentZoom = this.map.getZoom();
    var h3res = this.getResolution(currentZoom);

    const bounds = this.map.getBounds();
    const x1 = bounds.getWest();
    const x2 = bounds.getEast();
    const y1 = bounds.getSouth();
    const y2 = bounds.getNorth();
    if (![x1, x2, y1, y2].every(Number.isFinite)) {
      return { type: 'FeatureCollection', features: [] };
    }
    const dh = x2 - x1;
    const dv = y2 - y1;

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

    while (lowerX < this.longitudeMax && lowerX < x2withBuffer && y1withBuffer < y2withBuffer) {
      let upperX = Math.min(lowerX + xIncrement, x2withBuffer, 180);
      coordinates.push([
        [y2withBuffer, lowerX],
        [y2withBuffer, upperX],
        [y1withBuffer, upperX],
        [y1withBuffer, lowerX]
      ]);
      lowerX += xIncrement;
    }

    var shapes = [].concat(...coordinates.map(e => {
      try {
        return h3.polygonToCells(e, h3res);
      } catch (error) {
        return [];
      }
    }));
    var features = [];
    const seen = new Set();

    for (var i = 0; i < shapes.length; i++) {
      let h3_id = shapes[i];
      if (seen.has(h3_id)) continue;
      seen.add(h3_id);

      let boundary = h3.cellToBoundary(h3_id, true);

      // Adjust boundary coordinates if they cross the anti-meridian
      if (boundary.find((e) => e[0] < -130) !== undefined) {
        boundary = boundary.map((e) => e[0] > 0 ? [e[0] - 360, e[1]] : e);
      }
      const resolution = h3.getResolution(h3_id);
      const edge_unit = resolution > 7 ? h3.UNITS.m : h3.UNITS.km;
      const area_unit = resolution > 7 ? h3.UNITS.m2 : h3.UNITS.km2;

      const icosa_faces = h3.getIcosahedronFaces(h3_id);

      let area = h3.cellArea(h3_id, area_unit);
      area = parseFloat(area.toFixed(1)).toLocaleString();

      let num_hex = h3.getNumCells(h3res);
      num_hex = num_hex.toLocaleString();

      const feature = {
        type: "Feature",
        properties: {
          color: h3.isPentagon(h3_id) ? 'blue' : this.options.color,
          h3_id: h3_id,
          resolution: resolution,
          icosa_faces: icosa_faces,
          area: area,
          area_unit: area_unit,
          edge_unit: edge_unit,
          num_hex: num_hex
        },
        geometry: {
          type: "Polygon",
          coordinates: [boundary]
        }
      };

      features.push(feature);
    }
    return {
      type: "FeatureCollection",
      features,
    };
  }
}

export default H3Grid;
