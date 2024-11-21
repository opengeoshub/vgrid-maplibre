class MaidenheadGrid {
    constructor(map, options = {}) {
      this.map = map;
      this.options = Object.assign({
        color: 'rgba(255, 0, 0, 0.4)', // Line and label color
        redraw: 'move', // Redraw on move or moveend
      }, options);
      this.sourceId = 'maidenhead-grid';
      this.lineLayerId = 'maidenhead-grid-lines';
      this.labelLayerId = 'maidenhead-grid-labels';
      this.initialize();
    }
  
    initialize() {
      // Add a GeoJSON source for the grid
      this.map.addSource(this.sourceId, {
        type: 'geojson',
        data: this.generateGrid(),
      });
  
      // Add a line layer for the grid
      this.map.addLayer({
        id: this.lineLayerId,
        type: 'line',
        source: this.sourceId,
        paint: {
          'line-color': this.options.color,
          'line-width': 1,
        },
      });
  
      // Add a symbol layer for the labels
      this.map.addLayer({
        id: this.labelLayerId,
        type: 'symbol',
        source: this.sourceId,
        layout: {
          'text-field': ['get', 'label'],
          'text-size': 12,
          'text-font': ['Open Sans Bold'],
        },
        paint: {
          'text-color': this.options.color,
        },
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
  
    generateGrid() {
      const bounds = this.map.getBounds();
      const zoom = Math.floor(this.map.getZoom());
  
      const d3 = [20, 10, 10, 10, 10, 10, 1, 1, 1, 1, 1 / 24, 1 / 24, 1 / 24, 1 / 24, 1 / 24, 1 / 240, 1 / 240, 1 / 240, 1 / 240 / 24, 1 / 240 / 24];
      const unit = d3[zoom] || 20; // Default to 20 if zoom is out of range
  
      const features = [];
      for (let lon = Math.floor(bounds.getWest() / unit) * unit; lon < bounds.getEast(); lon += unit * 2) {
        for (let lat = Math.floor(bounds.getSouth() / unit) * unit; lat < bounds.getNorth(); lat += unit) {
          const bounds = [
            [lon, lat],
            [lon + unit * 2, lat + unit],
          ];
  
          // Add rectangle geometry
          features.push({
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [[
                [lon, lat],
                [lon + unit * 2, lat],
                [lon + unit * 2, lat + unit],
                [lon, lat + unit],
                [lon, lat],
              ]],
            },
          });
  
          // Add label point
          const label = this.getLocator(lon + unit, lat + unit / 2, zoom);
          features.push({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [lon + unit, lat + unit / 2],
            },
            properties: { label },
          });
        }
      }
  
      return {
        type: 'FeatureCollection',
        features,
      };
    }
  
    getLocator(lon, lat, zoom) {
      const d1 = 'ABCDEFGHIJKLMNOPQR'.split('');
      const d2 = 'ABCDEFGHIJKLMNOPQRSTUVWX'.split('');
      const ydiv = [10, 1, 1 / 24, 1 / 240, 1 / 240 / 24];
  
      let locator = '';
      let x = lon + 180;
      let y = lat + 90;
  
      locator += d1[Math.floor(x / 20)] + d1[Math.floor(y / 10)];
      const precision = Math.min(zoom, 4);
  
      for (let i = 0; i < precision; i++) {
        const rlon = x % (ydiv[i] * 2);
        const rlat = y % ydiv[i];
        if (i % 2 === 0) {
          locator += Math.floor(rlon / (ydiv[i + 1] * 2)) + Math.floor(rlat / ydiv[i + 1]);
        } else {
          locator += d2[Math.floor(rlon / (ydiv[i + 1] * 2))] + d2[Math.floor(rlat / ydiv[i + 1])];
        }
      }
  
      return locator;
    }
  }
  
  export default MaidenheadGrid;
  