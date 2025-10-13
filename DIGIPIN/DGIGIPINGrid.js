// ───────────────────────────────────────────────────────────
//  DIGIPIN Reference Implementation
// ───────────────────────────────────────────────────────────
const DIGIPIN_GRID = [
  ['F', 'C', '9', '8'],
  ['J', '3', '2', '7'],
  ['K', '4', '5', '6'],
  ['L', 'M', 'P', 'T'],
];

const CHAR_POSITION_MAP = new Map();
for (let r = 0; r < DIGIPIN_GRID.length; r++) {
  for (let c = 0; c < DIGIPIN_GRID[r].length; c++) {
    CHAR_POSITION_MAP.set(DIGIPIN_GRID[r][c], [r, c]);
  }
}

const BOUNDS = Object.freeze({
  minLat: 2.5,
  maxLat: 38.5,
  minLon: 63.5,
  maxLon: 99.5,
});

function getDIGIPINFromLatLon(lat, lon, precision = 10) {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return 'Out of Bound';
  if (lat < BOUNDS.minLat || lat > BOUNDS.maxLat) return 'Out of Bound';
  if (lon < BOUNDS.minLon || lon > BOUNDS.maxLon) return 'Out of Bound';

  lat = Number(lat.toFixed(6));
  lon = Number(lon.toFixed(6));

  let minLat = BOUNDS.minLat;
  let maxLat = BOUNDS.maxLat;
  let minLon = BOUNDS.minLon;
  let maxLon = BOUNDS.maxLon;
  let pin = '';

  for (let level = 1; level <= precision; level++) {
    const latDiv = (maxLat - minLat) / 4;
    const lonDiv = (maxLon - minLon) / 4;

    const row = 3 - Math.floor((lat - minLat) / latDiv);
    const col = Math.floor((lon - minLon) / lonDiv);

    const r = Math.min(Math.max(row, 0), 3);
    const c = Math.min(Math.max(col, 0), 3);

    pin += DIGIPIN_GRID[r][c];
    if (level === 3 || level === 6) pin += '-';

    maxLat = minLat + latDiv * (4 - r);
    minLat = minLat + latDiv * (3 - r);
    minLon = minLon + lonDiv * c;
    maxLon = minLon + lonDiv;
  }

  // Remove trailing dash if present
  if (pin.endsWith('-')) {
    pin = pin.slice(0, -1);
  }

  return pin;
}

function getBoundsFromDIGIPIN(pin) {
  const clean = pin.replace(/-/g, '');
  if (clean.length < 1) return 'Invalid DIGIPIN';

  let minLat = BOUNDS.minLat;
  let maxLat = BOUNDS.maxLat;
  let minLon = BOUNDS.minLon;
  let maxLon = BOUNDS.maxLon;

  for (const ch of clean) {
    const position = CHAR_POSITION_MAP.get(ch);
    if (!position) return 'Invalid DIGIPIN';

    const [r, c] = position;
    const latDiv = (maxLat - minLat) / 4;
    const lonDiv = (maxLon - minLon) / 4;

    const lat1 = maxLat - latDiv * (r + 1);
    const lat2 = maxLat - latDiv * r;
    const lon1 = minLon + lonDiv * c;
    const lon2 = minLon + lonDiv * (c + 1);

    minLat = lat1;
    maxLat = lat2;
    minLon = lon1;
    maxLon = lon2;
  }

  return { minLat, maxLat, minLon, maxLon };
}

class DIGIPINGrid {
  constructor(map, options = {}) {
    this.map = map;
    this.options = {
      color: options.color || 'rgba(255, 0, 0, 1)',
      width: options.width || 1,
      redraw: options.redraw || 'moveend',
    };
    this.sourceId = 'digipin-grid';
    this.gridLayerId = 'digipin-grid-layer';
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
    // Map zoom levels to DIGIPIN precision (1-10 characters)
    if (zoom < 4) return 1;
    if (zoom < 6) return 2;
    if (zoom < 8) return 3;
    if (zoom < 10) return 4;
    if (zoom < 12) return 5;
    if (zoom < 14) return 6;
    if (zoom < 16) return 7;
    if (zoom < 18) return 8;
    if (zoom < 20) return 9;
    return 10;
  }

  generateGrid() {
    const zoom = this.map.getZoom();
    const resolution = this.getResolution(zoom);

    // Calculate sampling density based on resolution
    const baseWidth = 9; // degrees at resolution 1
    const factor = Math.pow(0.25, resolution - 1); // each level divides by 4
    const sampleWidth = baseWidth * factor;

    const bounds = this.map.getBounds();
    const minLat = Math.max(bounds.getSouth(), BOUNDS.minLat);
    const minLon = Math.max(bounds.getWest(), BOUNDS.minLon);
    const maxLat = Math.min(bounds.getNorth(), BOUNDS.maxLat);
    const maxLon = Math.min(bounds.getEast(), BOUNDS.maxLon);

    const seenCells = new Set();
    const features = [];

    // Sample points across the viewport
    for (let lon = minLon; lon <= maxLon; lon += sampleWidth) {
      for (let lat = minLat; lat <= maxLat; lat += sampleWidth) {
        try {
          // Get DIGIPIN code for this point at the specified precision
          const digipinCode = getDIGIPINFromLatLon(lat, lon, resolution);
          
          if (digipinCode === 'Out of Bound') continue;
          if (seenCells.has(digipinCode)) continue;
          seenCells.add(digipinCode);

          // Get the bounds for this DIGIPIN cell
          const cellBounds = getBoundsFromDIGIPIN(digipinCode);
          
          if (cellBounds === 'Invalid DIGIPIN') continue;

          const { minLat: cellMinLat, maxLat: cellMaxLat, minLon: cellMinLon, maxLon: cellMaxLon } = cellBounds;

          // Create polygon for this cell
          const coords = [[
            [cellMinLon, cellMinLat],
            [cellMaxLon, cellMinLat],
            [cellMaxLon, cellMaxLat],
            [cellMinLon, cellMaxLat],
            [cellMinLon, cellMinLat]
          ]];

          const feature = {
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: coords,
            },
            properties: {
              digipin_id: digipinCode,
              resolution,
            }
          };

          features.push(feature);
        } catch (error) {
          // Skip cells outside bounds or with errors
          continue;
        }
      }
    }

    return {
      type: 'FeatureCollection',
      features: features
    };
  }
}

export default DIGIPINGrid;