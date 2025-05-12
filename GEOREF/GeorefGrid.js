// Reference: https://github.com/ha8tks/Leaflet.Georef/blob/master/src/L.Georef.js

class GeorefGrid {
  constructor(map, options = {}) {
    this.lonorig_ = -180;
    this.latorig_ = -90;
    this.maxprec_ = 11
    this.digits_ = "0123456789"
    this.lontile_ = "ABCDEFGHJKLMNPQRSTUVWXYZ"
    this.lattile_ = "ABCDEFGHJKLMM"
    this.degrees_ = "ABCDEFGHJKLMNPQ"
    this.tile_ = 15
    this.base_ = 10
    this.baselen_ = 4
    this.maxprec_ = 11
    this.maxlen_ = this.baselen_ + 2 * this.maxprec_

    this.map = map;
    this.options = {
      color: options.color || 'rgba(255, 0, 0, 1)',
      redraw: options.redraw || 'move', // Default to redraw on move
    };
    this.sourceId = 'georef-grid';
    this.gridLayerId = 'georef-grid-layer';
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

  getResolution(zoom) {
    if (zoom <= 7) return 0;
    if (zoom <= 11) return 1;
    if (zoom <= 15) return 2;
    if (zoom <= 18) return 3;
    if (zoom <= 21) return 4;
    return 5;
  }

  generateGrid() {
    const zoom = this.map.getZoom();
    const resolution = this.getResolution(zoom);

    const bounds = this.map.getBounds();
    let minLat = bounds.getSouth();
    let minLon = bounds.getWest();
    let maxLat = bounds.getNorth();
    let maxLon = bounds.getEast();

    let lonWidth, latWidth;

    if (resolution === 0) {
      lonWidth = 15.0; latWidth = 15.0;
    } else if (resolution === 1) {
      lonWidth = 1.0; latWidth = 1.0;
    } else if (resolution === 2) {
      lonWidth = 1 / 60; latWidth = 1 / 60; // 1 minutes x 1 minutes
    } else if (resolution === 3) {
      lonWidth = 1 / 600; latWidth = 1 / 600; // 0.1 minutes x 0.1 minutes
    } else if (resolution === 4) {
      lonWidth = 1 / 6000; latWidth = 1 / 6000;
    } else if (resolution === 5) {
      lonWidth = 1 / 60000; latWidth = 1 / 60000;
    } else {
      throw new Error("Unsupported resolution");
    }

    const baseLon = -180;
    const baseLat = -90;

    const startLon = Math.floor((minLon - baseLon) / lonWidth) * lonWidth + baseLon;
    const endLon = Math.ceil((maxLon - baseLon) / lonWidth) * lonWidth + baseLon;

    const startLat = Math.floor((minLat - baseLat) / latWidth) * latWidth + baseLat;
    const endLat = Math.ceil((maxLat - baseLat) / latWidth) * latWidth + baseLat;

    const longitudes = [];
    const latitudes = [];

    for (let lon = startLon; lon < endLon; lon += lonWidth) {
      if (lon >= -180 && lon <= 180) longitudes.push(lon);
    }

    for (let lat = startLat; lat < endLat; lat += latWidth) {
      if (lat >= -90 && lat <= 90) latitudes.push(lat);
    }

    const features = [];

    for (const lon of longitudes) {
      for (const lat of latitudes) {
        const minLon = lon;
        const minLat = lat;
        const maxLon = lon + lonWidth;
        const maxLat = lat + latWidth;

        const coordinates = [[
          [minLon, minLat],
          [maxLon, minLat],
          [maxLon, maxLat],
          [minLon, maxLat],
          [minLon, minLat] // close polygon
        ]];

        const polygon = {
          type: "Polygon",
          coordinates: coordinates
        };

        const centroidLat = (minLat+maxLat)/2
        const centroidLon = (minLon+maxLon)/2

        const georef_id = this.encode(centroidLat, centroidLon, resolution);
        features.push({
          type: "Feature",
          properties: {
            georef_id: georef_id,
            resolution: resolution,
          },
          geometry: polygon
        });
      }
    }

    return {
      type: "FeatureCollection",
      features: features
    };
  }


  findFirstNotOf(s, sSet) {
    for (let i = 0; i < s.length; i++) {
      if (!sSet.includes(s[i])) {
        return i;
      }
    }
    return -1;
  }

  lookup(s, c) {
    const r = s.indexOf(c);
    return r < 0 ? -1 : r;
  }


  encode(lat, lon, prec) {
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

    if (lon >= 180) {
      lon = lon - 360;
    }

    if (lat === 90) {
      lat = lat - Number.EPSILON;
    }

    prec = Math.max(-1, Math.min(parseInt(this.maxprec_), prec));

    if (prec === 1) {
      prec += 1; // Disallow prec = 1
    }

    const m = 60000000000;
    let x = Math.floor(lon * m) - this.lonorig_ * m;
    let y = Math.floor(lat * m) - this.latorig_ * m;
    const ilon = Math.floor(x / m);
    const ilat = Math.floor(y / m);
    const georef1 = Array(this.maxlen_).fill("");

    georef1[0] = this.lontile_[Math.floor(ilon / this.tile_)];
    georef1[1] = this.lattile_[Math.floor(ilat / this.tile_)];

    if (prec >= 0) {
      georef1[2] = this.degrees_[ilon % this.tile_];
      georef1[3] = this.degrees_[ilat % this.tile_];
      if (prec > 0) {
        x = x - m * ilon;
        y = y - m * ilat;
        const d = Math.pow(this.base_, this.maxprec_ - prec);
        x = Math.floor(x / d);
        y = Math.floor(y / d);
        let c = prec;
        while (c > 0) {
          georef1[this.baselen_ + c] = this.digits_[x % this.base_];
          x = Math.floor(x / this.base_);
          georef1[this.baselen_ + c + prec] = this.digits_[y % this.base_];
          y = Math.floor(y / this.base_);
          c -= 1;
        }
      }
    }

    return georef1.join('');
  }

  decode(georef, centerp = false) {
    if (!georef) {
      throw new Error('Invalid Georef string: None');
    }

    georef = georef.toUpperCase();
    const leng = georef.length;

    if (leng >= 3 && georef.startsWith('INV')) {
      throw new Error('Invalid Georef string');
    }

    if (leng < this.baselen_ - 2) {
      throw new Error(`Georef must start with at least 2 letters: ${georef}`);
    }

    const prec1 = Math.floor((2 + leng - this.baselen_) / 2 - 1);

    let k = this.lookup(this.lontile_, georef[0]);
    if (k < 0) {
      throw new Error(`Bad longitude tile letter in georef: ${georef}`);
    }
    let lon1 = k + this.lonorig_ / this.tile_;

    k = this.lookup(this.lattile_, georef[1]);
    if (k < 0) {
      throw new Error(`Bad latitude tile letter in georef: ${georef}`);
    }
    let lat1 = k + this.latorig_ / this.tile_;

    let unit = 1;

    if (leng > 2) {
      unit *= this.tile_;

      k = this.lookup(this.degrees_, georef[2]);
      if (k < 0) {
        throw new Error(`Bad longitude degree letter in georef: ${georef}`);
      }
      lon1 = lon1 * this.tile_ + k;

      if (leng < 4) {
        throw new Error(`Missing latitude degree letter in georef: ${georef}`);
      }

      k = this.lookup(this.degrees_, georef[3]);
      if (k < 0) {
        throw new Error(`Bad latitude degree letter in georef: ${georef}`);
      }
      lat1 = lat1 * this.tile_ + k;

      if (prec1 > 0) {
        const trailing = georef.slice(this.baselen_);
        if (this.findFirstNotOf(trailing, this.digits_) !== -1) {
          throw new Error(`Non digits in trailing portion of georef: ${trailing}`);
        }

        if (leng % 2 !== 0) {
          throw new Error(`Georef must end with an even number of digits: ${trailing}`);
        }

        if (prec1 === 1) {
          throw new Error(`Georef needs at least 4 digits for minutes: ${trailing}`);
        }

        if (prec1 > this.maxprec_) {
          throw new Error(`More than ${2 * this, maxprec_} digits in georef: ${trailing}`);
        }

        let i = 0;
        while (i < prec1) {
          const m = i ? this.base_ : 6;
          unit *= m;

          const x = this.lookup(this.digits_, georef[this.baselen_ + i]);
          const y = this.lookup(this.digits_, georef[this.baselen_ + i + prec1]);

          if (i === 0 && (x >= m || y >= m)) {
            throw new Error(`Minutes terms in georef must be less than 60: ${trailing}`);
          }

          lon1 = m * lon1 + x;
          lat1 = m * lat1 + y;
          i += 1;
        }
      }
    }

    if (centerp) {
      unit *= 2;
      lat1 = 2 * lat1 + 1;
      lon1 = 2 * lon1 + 1;
    }

    const lat = (this.tile_ * lat1) / unit;
    const lon = (this.tile_ * lon1) / unit;
    const prec = prec1;

    return { lat, lon, prec };
  }

}
export default GeorefGrid;
