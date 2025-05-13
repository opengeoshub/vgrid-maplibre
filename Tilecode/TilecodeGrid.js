const d2r = Math.PI / 180;
const r2d = 180 / Math.PI;

class TilecodeGrid {
  constructor(map, options = {}) {
    this.map = map;
    this.options = {
      color: options.color || 'rgba(255, 0, 0, 1)',
      width: options.width || 1,
      redraw: options.redraw || 'move',
    };
    this.sourceId = 'tilecode-grid';
    this.gridLayerId = 'tilecode-grid-layer';
    this.initialize();
  }

  initialize() {
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
        'fill-outline-color': this.options.color,
      },
    });

    this.map.addLayer({
      'id': 'outline',
      'type': 'line',
      'source': this.sourceId,
      'layout': {},
      'paint': {
          'line-color': this.options.color,
          'line-width': this.options.width,
      }
  });


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
    const resolution = Math.floor(this.map.getZoom())+1;
  
    // Convert map bounds to tile coordinates
    const sw = this.latlonToTile(bounds.getSouth(), bounds.getWest(), resolution);
    const ne = this.latlonToTile(bounds.getNorth(), bounds.getEast(), resolution);
  
    const features = [];
  
    for (let x = sw[0]; x <= ne[0]; x++) {
      for (let y = ne[1]; y <= sw[1]; y++) {
        const tile = [x, y, resolution];
        const tilecode_id =  this.tileToTilecode(tile);
        const quadkey_id =  this.tileToQuadkey(tile);
        const exists = features.some(f => f.properties.tilecode_id === tilecode_id);
        if (exists) continue;

        const bbox = this.tileToBBOX(tile); // [w, s, e, n]
        const coords = [[
          [bbox[0], bbox[3]],
          [bbox[0], bbox[1]],
          [bbox[2], bbox[1]],
          [bbox[2], bbox[3]],
          [bbox[0], bbox[3]],
        ]];

        const feature = {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: coords,
          },
          properties: {
            tilecode_id: tilecode_id,
            quadkey_id: quadkey_id,
            resolution,
          }
        };  
        features.push(feature);
      }
    }
  
    return {
      type: 'FeatureCollection',
      features: features,
    };
  }
  
  tile2lon(x, z) {
    return (x / Math.pow(2, z)) * 360 - 180;
  }

  tile2lat(y, z) {
    const n = Math.PI - (2 * Math.PI * y) / Math.pow(2, z);
    return r2d * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
  }

  tileToBBOX(tile) {
    const e = this.tile2lon(tile[0] + 1, tile[2]);
    const w = this.tile2lon(tile[0], tile[2]);
    const s = this.tile2lat(tile[1] + 1, tile[2]);
    const n = this.tile2lat(tile[1], tile[2]);
    return [w, s, e, n];
  }

  latlonToTile(lat, lon, z) {
    const tile = this.latlonToTileFraction(lat, lon, z);
    tile[0] = Math.floor(tile[0]);
    tile[1] = Math.floor(tile[1]);
    return tile;
  }

  latlonToTileFraction(lat, lon, z) {
    // if (lon > 180.0) lon = 180.0;
    // else if (lon < -180.0) lon = -180.0;
  
    // if (lat > 90.0) lat = 90.0;
    // else if (lat < -90.0) lat = -90.0;
    const sin = Math.sin(lat * d2r);
    const z2 = Math.pow(2, z);
    let x = z2 * (lon / 360 + 0.5);
    const y = z2 * (0.5 - (0.25 * Math.log((1 + sin) / (1 - sin))) / Math.PI);

    x = x % z2;
    if (x < 0) x += z2;
    return [x, y, z];
  }

  tileToTilecode(tile) {
    const [x, y, z] = tile;
    const xInt = Math.floor(x);
    const yInt = Math.floor(y);
    // return `z${z}x${xInt}y${yInt}`;
    return `z${z}x${x}y${y}`;
  }
  
  getChildren(tile) {
    return [
      [tile[0] * 2, tile[1] * 2, tile[2] + 1],
      [tile[0] * 2 + 1, tile[1] * 2, tile[2] + 1],
      [tile[0] * 2 + 1, tile[1] * 2 + 1, tile[2] + 1],
      [tile[0] * 2, tile[1] * 2 + 1, tile[2] + 1],
    ];
  }

  getParent(tile) {
    return [tile[0] >> 1, tile[1] >> 1, tile[2] - 1];
  }

  getSiblings(tile) {
    return this.getChildren(this.getParent(tile));
  }

  hasSiblings(tile, tiles) {
    const siblings = this.getSiblings(tile);
    for (let i = 0; i < siblings.length; i++) {
      if (!this.hasTile(tiles, siblings[i])) return false;
    }
    return true;
  }

  hasTile(tiles, tile) {
    for (let i = 0; i < tiles.length; i++) {
      if (this.tilesEqual(tiles[i], tile)) return true;
    }
    return false;
  }

  tilesEqual(tile1, tile2) {
    return tile1[0] === tile2[0] && tile1[1] === tile2[1] && tile1[2] === tile2[2];
  }

  tileToQuadkey(tile) {
    let index = '';
    for (let z = tile[2]; z > 0; z--) {
      let b = 0;
      const mask = 1 << (z - 1);
      if ((tile[0] & mask) !== 0) b++;
      if ((tile[1] & mask) !== 0) b += 2;
      index += b.toString();
    }
    return index;
  }

  quadkeyToTile(quadkey) {
    let x = 0;
    let y = 0;
    const z = quadkey.length;
    for (let i = z; i > 0; i--) {
      const mask = 1 << (i - 1);
      const q = +quadkey[z - i];
      if (q === 1) x |= mask;
      if (q === 2) y |= mask;
      if (q === 3) {
        x |= mask;
        y |= mask;
      }
    }
    return [x, y, z];
  }

  getBboxZoom(bbox) {
    const MAX_ZOOM = 28;
    for (let z = 0; z < MAX_ZOOM; z++) {
      const mask = 1 << (32 - (z + 1));
      if (
        (bbox[0] & mask) !== (bbox[2] & mask) ||
        (bbox[1] & mask) !== (bbox[3] & mask)
      ) {
        return z;
      }
    }
    return MAX_ZOOM;
  }

  bboxToTile(bboxCoords) {
    const min = this.pointToTile(bboxCoords[0], bboxCoords[1], 32);
    const max = this.pointToTile(bboxCoords[2], bboxCoords[3], 32);
    const bbox = [min[0], min[1], max[0], max[1]];

    const z = this.getBboxZoom(bbox);
    if (z === 0) return [0, 0, 0];
    const x = bbox[0] >>> (32 - z);
    const y = bbox[1] >>> (32 - z);
    return [x, y, z];
  }
}


export default TilecodeGrid;