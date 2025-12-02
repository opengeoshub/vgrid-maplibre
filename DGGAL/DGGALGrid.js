import { DGGAL } from './dggal.js';
let dggal;
const initPromise = DGGAL.init();

const DGGAL_TYPES = {
  "GNOSISGlobalGrid": {"min_res": 0, "max_res": 28},
 
  "ISEA4R": {"min_res": 0, "max_res": 20},
  "ISEA9R": {"min_res": 0, "max_res": 16},
  "ISEA3H": {"min_res": 0, "max_res": 33},
  "ISEA7H": {"min_res": 0, "max_res": 19},
  "ISEA7H_Z7": {"min_res": 0, "max_res": 19}, 
  
  "IVEA4R": {"min_res": 0, "max_res": 20},  
  "IVEA9R": {"min_res": 0, "max_res": 16},
  "IVEA3H": {"min_res": 0, "max_res": 33},
  "IVEA7H": {"min_res": 0, "max_res": 19},
  "IVEA7H_Z7": {"min_res": 0, "max_res": 19},
  
  "RTEA4R": {"min_res": 0, "max_res": 20},
  "RTEA9R": {"min_res": 0, "max_res": 16},
  "RTEA3H": {"min_res": 0, "max_res": 33},
  "RTEA7H": {"min_res": 0, "max_res": 19},
  "RTEA7H_Z7": {"min_res": 0, "max_res": 19},
  
  "HEALPix": {"min_res": 0,"max_res": 26},
  "rHEALPix": {"min_res": 0,"max_res": 16} 
};

class DGGALGrid {
    constructor(dggs, map, options = {}) {
    this.dggs = dggs;
    this.map = map;
    this.options = {
      color: options.color || 'rgba(255, 0, 0, 1)',
      width: options.width || 1,
      redraw: options.redraw || 'moveend',
    };
    this.sourceId = 'dggal-grid';
    this.gridLayerId = 'dggal-grid-layer';
    this.initialize();
  }

  async initialize() {
    // Wait for DGGAL to initialize
    dggal = await initPromise;
    
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
  
  async updateGrid() {
    // Ensure DGGAL is initialized
    if (!dggal) {
      dggal = await initPromise;
    }
    
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

  getResolution(dggs, zoom) {
    let resolution;
    
    switch(dggs) {
      case 'ISEA3H':
      case 'IVEA3H':
      case 'RTEA3H':
        resolution = Math.floor(zoom * 1.15);
        break; 
      
      case 'ISEA4R':
      case 'IVEA4R':
      case 'RTEA4R':
      case 'HEALPix':
        resolution = Math.floor(zoom * 0.95);
        break; 

      case 'ISEA7H':
      case 'ISEA7H_Z7':
      case 'IVEA7H':
      case 'IVEA7H_Z7':
      case 'RTEA7H':
      case 'RTEA7H_Z7':
        resolution = Math.floor(zoom * 0.65);
        break;

      case 'ISEA9R':
      case 'IVEA9R':
      case 'RTEA9R':
      case 'rHEALPix':
        resolution = Math.floor(zoom * 0.6);
        break;
        
      default:
        // Default case for GNOSISGlobalGrid.
        resolution = Math.floor(zoom);
        break;
    }

    // Clamp resolution to valid range for this DGGS type
    resolution = Math.min(DGGAL_TYPES[dggs].max_res, Math.max(DGGAL_TYPES[dggs].min_res, resolution));
  
    return resolution;
  }

  generateGrid() {
    const zoom = this.map.getZoom();
    const resolution = this.getResolution(this.dggs, zoom);
    
    // Get current map bounds
    const bounds = this.map.getBounds();
    const minLat = bounds.getSouth();
    const minLon = bounds.getWest();
    const maxLat = bounds.getNorth();
    const maxLon = bounds.getEast();

    // Create DGGRS instance
    const dggrs = dggal.createDGGRS(this.dggs);
    
    // Create bounding box for listZones (convert degrees to radians)
    const bbox = {
      ll: { 
        lat: minLat * Math.PI / 180, 
        lon: minLon * Math.PI / 180 
      },
      ur: { 
        lat: maxLat * Math.PI / 180, 
        lon: maxLon * Math.PI / 180 
      }
    };
    
    // Get zones that intersect with the current map extent
    const zones = dggrs.listZones(resolution, bbox);
    
    const features = [];
    
    for (const zone of zones) {
      // Validate zone
      if (zone === DGGAL.nullZone) {
        continue;
      }
      
      const dggal_id = dggrs.getZoneTextID(zone);
      
      // Get vertices in radians and convert to degrees
      const vertices = dggrs.getZoneRefinedWGS84Vertices(zone, 0);
      
      // Convert vertices to [lon, lat] degrees and ensure ring is closed
      const coordsDeg = (Array.isArray(vertices) ? vertices : []).map(v => [
        v.lon * 180 / Math.PI, 
        v.lat * 180 / Math.PI
      ]);
      
      if (coordsDeg.length === 0) {
        continue;
      }
      
      // Ensure the ring is closed
      const first = coordsDeg[0];
      const last = coordsDeg[coordsDeg.length - 1];
      if (first[0] !== last[0] || first[1] !== last[1]) {
        coordsDeg.push([first[0], first[1]]);
      }
      
      const feature = {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [coordsDeg],
        },
        properties: {
          dggal_id: dggal_id,
          resolution,
        }
      };

      features.push(feature);
    }
    
    // Clean up
    dggrs.delete();

    return {
      type: "FeatureCollection",
      features: features
    };
  }
}

export default DGGALGrid;