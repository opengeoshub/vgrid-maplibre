//  Reference: https://a5geo.org/
import * as A5 from 'https://unpkg.com/a5-js/dist/a5.js';

class A5Grid {
  constructor(map, options = {}) {
    this.map = map;
    this.options = {
      color: options.color || 'rgba(255, 0, 0, 1)',
      width: options.width || 1,
      redraw: options.redraw || 'move',
    };
    this.sourceId = 'a5-grid';
    this.gridLayerId = 'a5-grid-layer';
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
          'line-color': this.options.color,
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
          'line-color': this.options.color,
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

  getResolution(zoom) {
    const resolution = Math.floor(zoom) + 1;
    return resolution > 1 ? resolution : 1;
  }

  generateGrid() {
    const zoom = this.map.getZoom();
    const resolution = this.getResolution(zoom);
    let lonWidth, latWidth;

    if (resolution === 1) {
      lonWidth = 75;
      latWidth = 75;
    } else if (resolution === 2) {
      lonWidth = 15;
      latWidth = 15;
    } else if (resolution === 3) {
      lonWidth = 10;
      latWidth = 10;
    } else if (resolution > 3) {
      const baseWidth = 10; // at resolution 3
      const factor = Math.pow(0.5, resolution - 3);
      lonWidth = baseWidth * factor;
      latWidth = baseWidth * factor;
    }
    
    const bounds = this.map.getBounds();
    const minLat = bounds.getSouth();
    const minLon = bounds.getWest();
    const maxLat = bounds.getNorth();
    const maxLon = bounds.getEast();

    const longitudes = [];
    const latitudes = [];

    for (let lon = minLon; lon < maxLon; lon += lonWidth) {
      longitudes.push(lon);
    }

    for (let lat = minLat; lat < maxLat; lat += latWidth) {
      latitudes.push(lat);
    }

    const features = [];
    for (const lon of longitudes) {
      for (const lat of latitudes) {
        const minLon = lon;
        const minLat = lat;
        const maxLon = lon + lonWidth;
        const maxLat = lat + latWidth;

        const centroidLat = (minLat + maxLat) / 2
        const centroidLon = (minLon + maxLon) / 2

        const cellId = A5.lonLatToCell([centroidLon, centroidLat], resolution);
        const boundary = A5.cellToBoundary(cellId); // Array of [lng, lat] pairs
        const coords = [[...boundary, boundary[0]]];
        // Fix antimeridian crossing 
        // if (coords.find(([lng, _]) => lng > 130)) {
        //   coords = coords.map(([lng, lat]) =>
        //     lng < 0 ? [lng + 360, lat] : [lng, lat]
        //   )
        // };
      
        const a5_id = A5.bigIntToHex(cellId);
        const exists = features.some(f => f.properties.a5_id === a5_id);
        if (exists) continue;

        const feature = {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: coords,
          },
          properties: {
            a5_id: a5_id,
            resolution,
          }
        };

        features.push(feature)
      }
    }

    return {
      type: "FeatureCollection",
      features: features
    };

    
  }
}

export default A5Grid;