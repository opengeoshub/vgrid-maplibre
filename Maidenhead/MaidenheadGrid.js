// Reference: https://github.com/ha8tks/Leaflet.Maidenhead/blob/master/src/L.Maidenhead.js

class MaidenheadGrid {
  constructor(map, options = {}) {
    this.latitudeMax = 90;
    this.latitudeMin = -this.latitudeMax;
    this.longitudeMax = 180;
    this.longitudeMin = -this.longitudeMax;
    this.map = map;
    this.options = {
      color: options.color || 'rgba(255, 0, 0, 1)',
      width: options.width || 1,
      redraw: options.redraw || 'moveend', // Default to redraw on moveend
    };
    this.sourceId = 'maidenhead-grid';
    this.gridLayerId = 'maidenhead-grid-layer';
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
    if (zoom <= 4) return 1;
    if (zoom <= 7) return 2;
    if (zoom <= 12) return 3;
    return 4;
  }

  generateGrid() {
    const zoom = Math.floor(this.map.getZoom());
    const resolution = this.getResolution(zoom);

    const bounds = this.map.getBounds();
    let minLat = bounds.getSouth();
    let minLon = bounds.getWest();
    let maxLat = bounds.getNorth();
    let maxLon = bounds.getEast();

    let lonWidth, latWidth;

    if (resolution === 1) {
      lonWidth = 20.0; latWidth = 10.0;
    } else if (resolution === 2) {
      lonWidth = 2.0; latWidth = 1.0;
    } else if (resolution === 3) {
      lonWidth = 0.083333; latWidth = 0.041666; // 5 minutes x 2.5 minutes
    } else if (resolution === 4) {
      lonWidth = 0.008333; latWidth = 0.0041671; //30 seconds x 15 seconds
    } else {
      throw new Error("Unsupported resolution");
    }

    const baseLat = -90;
    const baseLon = -180;

    const startX = Math.floor((minLon - baseLon) / lonWidth);
    const endX = Math.floor((maxLon - baseLon) / lonWidth);
    const startY = Math.floor((minLat - baseLat) / latWidth);
    const endY = Math.floor((maxLat - baseLat) / latWidth);

    const features = [];

    for (let x = startX; x <= endX; x++) {
      for (let y = startY; y <= endY; y++) {
        const cellMinLon = baseLon + x * lonWidth;
        const cellMaxLon = cellMinLon + lonWidth;
        const cellMinLat = baseLat + y * latWidth;
        const cellMaxLat = cellMinLat + latWidth;
        // Ensure cell intersects with bounds
        if (
          cellMaxLon < minLon || cellMinLon > maxLon ||
          cellMaxLat < minLat || cellMinLat > maxLat
        ) continue;

        const cellCenterLat = (cellMinLat + cellMaxLat) / 2;
        const cellCenterLon = (cellMinLon + cellMaxLon) / 2;

        const maidenhead_id = this.toMaiden(cellCenterLat, cellCenterLon, resolution);
        const exists = features.some(f => f.properties.maidenhead_id === maidenhead_id);
        if (exists) continue;

        const {
          lat1: min_lat_maiden,
          lon1: min_lon_maiden,
          lat2: max_lat_maiden,
          lon2: max_lon_maiden
        } = this.maidenGrid(maidenhead_id);
        
        const coords = [[
          [min_lon_maiden, min_lat_maiden],  // Bottom-left corner
          [max_lon_maiden, min_lat_maiden], // Bottom-right corner
          [max_lon_maiden, max_lat_maiden], // Top-right corner
          [min_lon_maiden, max_lat_maiden], // Top-left corner
          [min_lon_maiden, min_lat_maiden]  // Closing the polygon (same as the first point)
        ]]

        const feature = {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: coords,
          },
          properties: {
            maidenhead_id: maidenhead_id,
            resolution,
          }
        };

        features.push(feature);
      }
    }

    return {
      type: "FeatureCollection",
      features: features
    };
  }

  isValid(c, level) {
    if (level === 0) {
        if (c < 'A' || c > 'R') {
            // throw new Error('Invalid maidenhead encoding');
            return false;
        }
    }
    if (level === 1 || level === 3) {
        if (c < '0' || c > '9') {
            // throw new Error('Invalid maidenhead encoding');
            return false;
        }
    }
    if (level === 2) {
        if (c < 'A' || c > 'X') {
            // throw new Error('Invalid maidenhead encoding');
            return false;
        }
    }
    return true;
}

  toMaiden(lat, lon, resolution) {
    if (lon < -180) {
      lon = -180
    }
    if (lon > 180) {
      lon = 180
    }
    if (lat < -90) {
      lat = -90
    }
    if (lat > 90) {
      lat = 90
    }

    // if (lon < -180.0 || lon > 180.0 || lat < -90.0 || lat > 90.0) {
    //   throw new Error('Maidenhead: invalid latitude and longitude');
    // }

    const A = 'A'.charCodeAt(0);
    let a = [(lon + 180) / 20, (lon + 180) % 20];
    let b = [(lat + 90) / 10, (lat + 90) % 10];

    let maiden = String.fromCharCode(A + Math.floor(a[0])) + String.fromCharCode(A + Math.floor(b[0]));

    lon = a[1] / 2;
    lat = b[1];

    let i = 1;
    while (i < resolution) {
      i += 1;
      a = [Math.floor(lon), lon % 1];
      b = [Math.floor(lat), lat % 1];

      if (i % 2 === 0) {
        maiden += `${a[0]}${b[0]}`;
        lon = 24 * a[1];
        lat = 24 * b[1];
      } else {
        maiden += String.fromCharCode(A + a[0]) + String.fromCharCode(A + b[0]);
        lon = 10 * a[1];
        lat = 10 * b[1];
      }
    }

    if (maiden.length >= 6) {
      maiden = maiden.slice(0, 4) + maiden.slice(4, 6).toLowerCase() + maiden.slice(6);
    }

    return maiden;
  }

  maidenGridCenter(maiden) {
    if (typeof maiden !== 'string') {
      throw new TypeError('Maidenhead locator must be a string');
    }

    maiden = maiden.trim().toUpperCase();
    const N = maiden.length;

    if (!(N >= 2 && N <= 8 && N % 2 === 0)) {
      throw new Error('Maidenhead locator requires 2-8 characters, even number of characters');
    }

    const Oa = 'A'.charCodeAt(0);
    let lon = -180;
    let lat = -90;

    // First pair
    // this.isValid(maiden[0], 0);
    // this.isValid(maiden[1], 0);
    lon += (maiden.charCodeAt(0) - Oa) * 20;
    lat += (maiden.charCodeAt(1) - Oa) * 10;
    if (N === 2) {
      lon += 10;
      lat += 5;
    }

    // Second pair
    if (N >= 4) {
      // this.isValid(maiden[2], 1);
      // this.isValid(maiden[3], 1);
      lon += parseInt(maiden[2]) * 2;
      lat += parseInt(maiden[3]) * 1;
    }
    if (N === 4) {
      lon += 1;
      lat += 0.5;
    }

    // Third pair
    if (N >= 6) {
      // this.isValid(maiden[4], 2);
      // this.isValid(maiden[5], 2);
      lon += (maiden.charCodeAt(4) - Oa) * (5.0 / 60);
      lat += (maiden.charCodeAt(5) - Oa) * (2.5 / 60);
    }
    if (N === 6) {
      lon += (5.0 / 120);
      lat += (2.5 / 120);
    }

    // Fourth pair
    if (N === 8) {
      lon += parseInt(maiden[6]) * (5.0 / 600);
      lat += parseInt(maiden[7]) * (2.5 / 600);
      lon += (5.0 / 1200);
      lat += (2.5 / 1200);
    }

    return { lat, lon };
  }

  maidenGrid(maiden) {
    if (typeof maiden !== 'string') {
        throw new TypeError('Maidenhead locator must be a string');
    }

    maiden = maiden.trim().toUpperCase();
    const N = maiden.length;

    if (!(N >= 2 && N <= 8 && N % 2 === 0)) {
        throw new Error('Maidenhead locator requires 2-8 characters, even number of characters');
    }

    const Oa = 'A'.charCodeAt(0);
    let lon = -180;
    let lat = -90;
    let lon1, lat1, lon2, lat2;

    // First pair
    // this.isValid(maiden[0], 0);
    // this.isValid(maiden[1], 0);
    lon += (maiden.charCodeAt(0) - Oa) * 20;
    lat += (maiden.charCodeAt(1) - Oa) * 10;

    if (N === 2) {
        lon1 = lon;
        lat1 = lat;
        lon2 = lon + 20;
        lat2 = lat + 10;
        lon += 10;
        lat += 5;
    }

    // Second pair
    if (N >= 4) {
      // this.isValid(maiden[2], 1);
      // this.isValid(maiden[3], 1);
        lon += parseInt(maiden[2]) * 2;
        lat += parseInt(maiden[3]) * 1;
    }
    if (N === 4) {
        lon1 = lon;
        lat1 = lat;
        lon2 = lon + 2;
        lat2 = lat + 1;
        lon += 1;
        lat += 0.5;
    }

    // Third pair
    if (N >= 6) {
      // this.isValid(maiden[4], 2);
      // this.isValid(maiden[5], 2);
        lon += (maiden.charCodeAt(4) - Oa) * (5 / 60);
        lat += (maiden.charCodeAt(5) - Oa) * (2.5 / 60);
    }
    if (N === 6) {
        lon1 = lon;
        lat1 = lat;
        lon2 = lon + (5 / 60);
        lat2 = lat + (2.5 / 60);
        lon += 5 / 120;
        lat += 2.5 / 120;
    }

    // Fourth pair
    if (N === 8) {
        lon += parseInt(maiden[6]) * (5 / 600);
        lat += parseInt(maiden[7]) * (2.5 / 600);
        lon1 = lon;
        lat1 = lat;
        lon2 = lon + (5 / 600);
        lat2 = lat + (2.5 / 600);
        lon += 5 / 1200;
        lat += 2.5 / 1200;
    }

    return {        
        lat1,
        lon1,
        lat2,
        lon2
    };
}
}
export default MaidenheadGrid;
