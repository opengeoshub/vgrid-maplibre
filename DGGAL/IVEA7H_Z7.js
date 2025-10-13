//  Reference: https://ivea7h_z7geo.org/
import { DGGAL } from './dggal.js';
let dggal;
const initPromise = DGGAL.init();

class IVEA7H_Z7Grid {
  constructor(map, options = {}) {
    this.map = map;
    this.options = {
      color: options.color || 'rgba(255, 0, 0, 1)',
      width: options.width || 1,
      redraw: options.redraw || 'move',
    };
    this.sourceId = 'dggal-grid';
    this.gridLayerId = 'dggal-grid-layer';
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
    const resolution = Math.floor(zoom);
    return resolution > 1 ? resolution : 1;
   
  }

  generateGrid() {
    const zoom = this.map.getZoom();
    const resolution = this.getResolution(zoom);
    let lonWidth, latWidth;

    if (resolution === 1) {
      lonWidth = 20;
      latWidth = 20;
    } else if (resolution === 2) {
      lonWidth = 10;
      latWidth = 10;
    } else if (resolution === 3) {
      lonWidth = 5;
      latWidth = 5;
    } else if (resolution > 3) {
      const baseWidth = 5; // at resolution 3
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

        const dggrs = dggal.createDGGRS('IVEA7H_Z7');
        const zone = dggrs.getZoneFromTextID('0234'); 
        const boundary = dggrs.getZoneRefinedWGS84Vertices(zone, 0); // Array of [lng, lat] pairs
        const coords = [[...boundary, boundary[0]]];
        const ivea7h_z7_id = dggrs.getZoneTextID(zone);
        // const exists = features.some(f => f.properties.ivea7h_z7_id === ivea7h_z7_id);
        // if (exists) continue;

        const feature = {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: coords,
          },
          properties: {
            ivea7h_z7_id: ivea7h_z7_id,
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

export default IVEA7H_Z7Grid;