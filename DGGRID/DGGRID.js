/**
 * MapLibre overlay for DGGRID cells via [webdggrid](https://github.com/am2222/webDggrid)
 * (see [Getting Started](https://am2222.github.io/webDggrid/getting-started.html)).
 */
const WEBDGGRID_INDEX = 'https://cdn.jsdelivr.net/npm/webdggrid/dist/index.js';

let dggsLoadPromise = null;

function getDggs() {
  if (!dggsLoadPromise) {
    dggsLoadPromise = import(WEBDGGRID_INDEX).then((m) => m.Webdggrid.load());
  }
  return dggsLoadPromise;
}

function clamp(n, lo, hi) {
  return Math.min(hi, Math.max(lo, n));
}

/** @param {number} lon */
function normalizeLon(lon) {
  let x = lon;
  while (x > 180) x -= 360;
  while (x < -180) x += 360;
  return x;
}

/**
 * Ray-casting point-in-polygon; ring is [lng, lat][] (closed or not).
 */
function pointInRing(lon, lat, ring) {
  if (!ring?.length) return false;
  const n = ring.length;
  const last = n - 1;
  const closed =
    ring[0][0] === ring[last][0] && ring[0][1] === ring[last][1];
  const m = closed ? n - 1 : n;
  let inside = false;
  for (let i = 0, j = m - 1; i < m; j = i++) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];
    if ((yj - yi) === 0) continue;
    const intersect =
      (yi > lat) !== (yj > lat) &&
      lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/** Counter-clockwise test for proper intersection checks. */
function ccw(ax, ay, bx, by, cx, cy) {
  return (cy - ay) * (bx - ax) > (by - ay) * (cx - ax);
}

function segmentsIntersect(ax, ay, bx, by, cx, cy, dx, dy) {
  const a = ccw(ax, ay, cx, cy, dx, dy) !== ccw(bx, by, cx, cy, dx, dy);
  const b = ccw(ax, ay, bx, by, cx, cy) !== ccw(ax, ay, bx, by, dx, dy);
  return a && b;
}

function segmentCrossesLonLatRect(ax, ay, bx, by, west, south, east, north) {
  const minx = Math.min(ax, bx);
  const maxx = Math.max(ax, bx);
  const miny = Math.min(ay, by);
  const maxy = Math.max(ay, by);
  if (maxx < west || minx > east || maxy < south || miny > north) {
    return false;
  }
  if (ax >= west && ax <= east && ay >= south && ay <= north) return true;
  if (bx >= west && bx <= east && by >= south && by <= north) return true;
  const edges = [
    [west, south, east, south],
    [east, south, east, north],
    [east, north, west, north],
    [west, north, west, south],
  ];
  for (const [x1, y1, x2, y2] of edges) {
    if (segmentsIntersect(ax, ay, bx, by, x1, y1, x2, y2)) return true;
  }
  return false;
}

/**
 * Whether a cell ring intersects the axis-aligned lon/lat bounds (planar test).
 */
function ringIntersectsBounds(ring, west, south, east, north) {
  if (!ring?.length) return false;
  const last = ring.length - 1;
  const closed =
    ring[0][0] === ring[last][0] && ring[0][1] === ring[last][1];
  const m = closed ? ring.length - 1 : ring.length;

  for (let i = 0; i < m; i++) {
    const lon = normalizeLon(ring[i][0]);
    const lat = ring[i][1];
    if (lon >= west && lon <= east && lat >= south && lat <= north) return true;
  }

  for (const [lon, lat] of [
    [west, south],
    [west, north],
    [east, south],
    [east, north],
  ]) {
    if (pointInRing(lon, lat, ring)) return true;
  }

  const cx = (west + east) / 2;
  const cy = (south + north) / 2;
  if (pointInRing(cx, cy, ring)) return true;

  for (let i = 0; i < m; i++) {
    const ax = normalizeLon(ring[i][0]);
    const ay = ring[i][1];
    const j = (i + 1) % m;
    const bx = normalizeLon(ring[j][0]);
    const by = ring[j][1];
    if (segmentCrossesLonLatRect(ax, ay, bx, by, west, south, east, north)) {
      return true;
    }
  }
  return false;
}

/**
 * One or two lon/lat rectangles for viewport bounds (handles antimeridian).
 * @returns {Array<[number, number, number, number]>} [west, south, east, north]
 */
function boundsToRects(bounds) {
  let w = normalizeLon(bounds.getWest());
  let e = normalizeLon(bounds.getEast());
  const s = bounds.getSouth();
  const n = bounds.getNorth();
  if (w <= e) return [[w, s, e, n]];
  return [
    [w, s, 180, n],
    [-180, s, e, n],
  ];
}

function ringIntersectsAnyRect(ring, rects) {
  return rects.some(([west, south, east, north]) =>
    ringIntersectsBounds(ring, west, south, east, north),
  );
}

/** True if the map viewport (four corners) lies inside the cell ring. */
function boundsCornersInsideRing(ring, bounds) {
  const corners = [
    bounds.getSouthWest(),
    bounds.getSouthEast(),
    bounds.getNorthWest(),
    bounds.getNorthEast(),
  ];
  return corners.every((p) => pointInRing(p.lng, p.lat, ring));
}

/**
 * @param {import('maplibre-gl').Map} map
 * @param {object} [options]
 * @param {object} [options.dggsConfig] Passed to Webdggrid.setDggs (poleCoordinates, azimuth, topology, projection, aperture or apertureSequence).
 * @param {string} [options.color]
 * @param {number} [options.width]
 * @param {string} [options.redraw] Map event name, default `moveend`.
 * @param {number} [options.minResolution]
 * @param {number} [options.maxResolution]
 */
class DGGRIDGrid {
  constructor(map, options = {}) {
    this.map = map;
    this.options = {
      dggsConfig: options.dggsConfig ?? {
        poleCoordinates: { lat: 0, lng: 0 },
        azimuth: 0,
        topology: 'HEXAGON',
        projection: 'ISEA',
        aperture: 4,
      },
      color: options.color ?? 'rgba(255, 0, 0, 1)',
      width: options.width ?? 1,
      redraw: options.redraw ?? 'moveend',
      minResolution: options.minResolution ?? 0,
      maxResolution: options.maxResolution ?? 21,
    };
    this.sourceId = 'dggrid';
    this.gridLayerId = 'dggrid-layer';
    this.outlineLayerId = 'outline';    
    this._dggs = null;
    this._hasListener = false;
    this.initialize();
  }

  async initialize() {
    this._dggs = await getDggs();
    const empty = { type: 'FeatureCollection', features: [] };

    if (!this.map.getSource(this.sourceId)) {
      this.map.addSource(this.sourceId, {
        type: 'geojson',
        data: empty,
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
        },
      });
    }

    if (!this.map.getLayer(this.outlineLayerId)) {
      this.map.addLayer({
        id: this.outlineLayerId,
        type: 'line',
        source: this.sourceId,
        layout: {},
        paint: {
          'line-color': this.options.color,
          'line-width': this.options.width,
        },
      });
    }

    await this.updateGrid();

    if (!this._hasListener) {
      this.map.on(this.options.redraw, () => this.updateGrid());
      this._hasListener = true;
    }
  }

  getResolutionFromZoom(zoom) {
    const aperture = this.options.dggsConfig?.aperture ?? 4;
    let factor = 0.9;
    if (aperture === 3) factor = 1.15;
    else if (aperture === 4) factor = 0.95;
    else if (aperture === 7) factor = 0.65;
    else if (aperture === 9) factor = 0.6;
    const r = Math.floor(zoom * factor);
    return clamp(r, this.options.minResolution, this.options.maxResolution);
  }

  /**
   * Fallback when `sequenceNumNeighbors` is unavailable (TRIANGLE topology or
   * `apertureSequence`, which disables SEQNUM-style addressing in webdggrid).
   */
  buildSamplePoints(bounds) {
    const west = bounds.getWest();
    const east = bounds.getEast();
    const south = bounds.getSouth();
    const north = bounds.getNorth();
    const zoom = this.map.getZoom();
    const resolution = this.getResolutionFromZoom(zoom);

    const latSpan = Math.max(1e-9, north - south);
    const lonSpan = Math.max(1e-9, east - west);
    const aspect = lonSpan / latSpan;

    const topology = this.options.dggsConfig?.topology ?? 'HEXAGON';
    const aperture = this.options.dggsConfig?.aperture ?? 4;
    /** Zoom-scaled cap: finer map → slightly more samples; TRIANGLE @ ap4 stays modest. */
    let maxSamples;
    if (topology === 'TRIANGLE' && aperture === 4) {
      maxSamples = clamp(Math.round(56 + zoom * 22 + zoom * zoom * 0.35), 72, 420);
    } else {
      maxSamples = clamp(Math.round(72 + zoom * 26 + zoom * zoom * 0.4), 96, 520);
    }
    const gridCap = clamp(Math.ceil(Math.sqrt(maxSamples)) + 8, 10, 42);

    let cols = Math.ceil(Math.sqrt(maxSamples * aspect));
    let rows = Math.ceil(maxSamples / Math.max(1, cols));
    cols = clamp(cols, 3, gridCap);
    rows = clamp(rows, 3, gridCap);
    if (rows * cols > maxSamples) {
      const scale = Math.sqrt((rows * cols) / maxSamples);
      rows = Math.max(3, Math.floor(rows / scale));
      cols = Math.max(3, Math.floor(cols / scale));
    }

    const coords = [];
    for (let i = 0; i <= rows; i++) {
      const lat = south + (latSpan * i) / rows;
      for (let j = 0; j <= cols; j++) {
        let lon = west + (lonSpan * j) / cols;
        if (lon > 180) lon -= 360;
        if (lon < -180) lon += 360;
        coords.push([lon, lat]);
      }
    }
    console.log('buildSamplePoints: points', coords.length);
    return { coords, resolution };
  }

  /**
   * BFS from a seed cell at the viewport center, expanding through
   * `sequenceNumNeighbors` while cells intersect the bounds (same idea as
   * `rhealpix_grid_within_bbox` in rhealpixgrid.py).
   */
  collectSequenceNumsViaNeighbors(bounds, resolution) {
    const rects = boundsToRects(bounds);
    const center = bounds.getCenter();
    const seedCoord = [[center.lng, center.lat]];
    const [seed] = this._dggs.geoToSequenceNum(seedCoord, resolution);
    const [seedRing] = this._dggs.sequenceNumToGrid([seed], resolution);

    if (boundsCornersInsideRing(seedRing, bounds)) {
      return [seed];
    }

    const maxCells = 25000;
    const maxPops = 400000;
    const collected = [];
    const covered = new Set();
    const queue = [seed];
    let pops = 0;

    while (queue.length > 0 && collected.length < maxCells && pops < maxPops) {
      pops += 1;
      const id = queue.shift();
      const key = id.toString();
      if (covered.has(key)) continue;
      covered.add(key);

      const [ring] = this._dggs.sequenceNumToGrid([id], resolution);
      if (!ringIntersectsAnyRect(ring, rects)) continue;

      collected.push(id);

      const neighborBatches = this._dggs.sequenceNumNeighbors([id], resolution);
      const neighbors = neighborBatches[0] ?? [];
      for (const nb of neighbors) {
        const nk = nb.toString();
        if (!covered.has(nk)) queue.push(nb);
      }
    }

    return collected;
  }

  sanitizeFeatureCollection(fc, resolution) {
    for (const f of fc.features) {
      if (typeof f.id === 'bigint') f.id = f.id.toString();
      if (f.properties?.id != null && typeof f.properties.id === 'bigint') {
        f.properties.id = f.properties.id.toString();
      }
      f.properties = {
        ...f.properties,
        dggrid_id: f.properties?.id ?? f.id ?? '',
        resolution,
      };
    }
    return fc;
  }

  generateGrid() {
    if (!this._dggs) {
      return { type: 'FeatureCollection', features: [] };
    }

    const bounds = this.map.getBounds();
    const resolution = this.getResolutionFromZoom(this.map.getZoom());
    this._dggs.setDggs(this.options.dggsConfig, resolution);

    const cfg = this.options.dggsConfig ?? {};
    const useNeighborBfs =
      cfg.topology !== 'TRIANGLE' && !cfg.apertureSequence;

    let unique;
    if (useNeighborBfs) {
      unique = this.collectSequenceNumsViaNeighbors(bounds, resolution);
    } else {
      const { coords } = this.buildSamplePoints(bounds);
      const seqNums = this._dggs.geoToSequenceNum(coords, resolution);
      const seen = new Set();
      unique = [];
      for (const id of seqNums) {
        const key = id.toString();
        if (!seen.has(key)) {
          seen.add(key);
          unique.push(id);
        }
      }
    }

    if (unique.length === 0) {
      return { type: 'FeatureCollection', features: [] };
    }

    const fc = this._dggs.sequenceNumToGridFeatureCollection(unique, resolution);
    return this.sanitizeFeatureCollection(fc, resolution);
  }

  async updateGrid() {
    if (!this._dggs) {
      this._dggs = await getDggs();
    }
    const data = this.generateGrid();
    const source = this.map.getSource(this.sourceId);
    if (source && 'setData' in source) {
      source.setData(data);
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
    if (!this.map.getLayer(this.outlineLayerId)) {
      this.map.addLayer({
        id: this.outlineLayerId,
        type: 'line',
        source: this.sourceId,
        layout: {},
        paint: {
          'line-color': this.options.color,
          'line-width': this.options.width,
        },
      });
    }
  }

  remove() {
    if (this.map.getLayer(this.gridLayerId)) {
      this.map.removeLayer(this.gridLayerId);
    }
    if (this.map.getLayer(this.outlineLayerId)) {
      this.map.removeLayer(this.outlineLayerId);
    }
  }
}

export default DGGRIDGrid;