class GeohashGrid {
  constructor(map, options = {}) {
    this.BASE32_CODES = "0123456789bcdefghjkmnpqrstuvwxyz";
    this.BASE32_CODES_DICT = {};
    for (let i = 0; i < this.BASE32_CODES.length; i++) {
      this.BASE32_CODES_DICT[this.BASE32_CODES.charAt(i)] = i;
    }
    this.ENCODE_AUTO = "auto";
    this.SIGFIG_HASH_LENGTH = [0, 5, 7, 8, 11, 12, 13, 15, 16, 17, 18];

    this.map = map;
    this.options = {
      color: options.color || 'rgba(255, 0, 0, 1)',
      width: options.width || 1,
      redraw: options.redraw || 'move', // Default to redraw on move
    };
    this.sourceId = 'geohash-grid';
    this.gridLayerId = 'geohash-grid-layer';
    // this.labelLayerId = 'geohash-label-layer';
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
      type: "fill",
      source: this.sourceId,
      paint: {
        "fill-color": "transparent",
        // "fill-outline-color": this.options.color
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
    const zoom = this.map.getZoom();
    const resolution = this.getResolution(zoom);

    const bounds = this.map.getBounds();
    let minLat = bounds.getSouth();
    let minLon = bounds.getWest();
    let maxLat = bounds.getNorth();
    let maxLon = bounds.getEast();

    let lonWidth, latWidth;

    const factor = Math.pow(4, resolution - 1);
    if (resolution === 1) {
      lonWidth = 360 / 8;
      latWidth = 180 / 4;
    }
    else if(resolution === 2)  {
      lonWidth = 360 / (8 * 4);
      latWidth = 180 / (8 * 4);
    }
    else if(resolution === 3)  {
      lonWidth = 360 / (8 * 32);
      latWidth = 180 / (4 * 32);
    
    }
    else if(resolution === 4)  {
      lonWidth = 360 / (8 * 32*4);
      latWidth = 180 / (4 * 32*8);
    }

    else if(resolution === 5)  {
      lonWidth = 360 / (8 * 32*4*8);
      latWidth = 180 / (4 * 32*8*4);
    }

    else if(resolution === 6)  {
      lonWidth = 360 / (8 * 32*4*8*4);
      latWidth = 180 / (4 * 32*8*4*8);
    }

    else if(resolution === 7)  {
      lonWidth = 360 / (8 * 32*4*8*4*8);
      latWidth = 180 / (4 * 32*8*4*8*4);
    }

    else if(resolution === 8)  {
      lonWidth = 360 / (8 * 32*4*8*4*8*4);
      latWidth = 180 / (4 * 32*8*4*8*4*8);
    }

    else if(resolution === 9)  {
      lonWidth = 360 / (8 * 32*4*8*4*8*4*8);
      latWidth = 180 / (4 * 32*8*4*8*4*8*4);
    }

    else if(resolution === 10)  {
      lonWidth = 360 / (8 * 32*4*8*4*8*4*8*4);
      latWidth = 180 / (4 * 32*8*4*8*4*8*4*8);
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

        const coords = [[
          [minLon, minLat],
          [maxLon, minLat],
          [maxLon, maxLat],
          [minLon, maxLat],
          [minLon, minLat] // close polygon
        ]];

        const centroidLat = (minLat + maxLat) / 2
        const centroidLon = (minLon + maxLon) / 2

        const geohash_id = this.encode(centroidLat, centroidLon, resolution);
        const exists = features.some(f => f.properties.geohash_id === geohash_id);
        if (exists) continue;

        const feature = {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: coords,
          },
          properties: {
            geohash_id: geohash_id,
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

  getResolution(zoom) {
    if (zoom < 4) return 1;
    if (zoom >= 4 && zoom < 6) return 2;
    if (zoom >= 6 && zoom < 8) return 3;
    if (zoom >= 8 && zoom < 10) return 4;
    if (zoom >= 10 && zoom < 12) return 5;
    if (zoom >= 12 && zoom < 14) return 6;
    if (zoom >= 14 && zoom < 16) return 7;
    if (zoom >= 16 && zoom < 18) return 8;
    if (zoom >= 18 && zoom < 20) return 9;
    return 10;
  }

  encode(latitude, longitude, numberOfChars) {
    if (numberOfChars === this.ENCODE_AUTO) {
      if (typeof (latitude) === 'number' || typeof (longitude) === 'number') {
        throw new Error('string notation required for auto resolution.');
      }
      var decSigFigsLat = latitude.split('.')[1].length;
      var decSigFigsLong = longitude.split('.')[1].length;
      var numberOfSigFigs = Math.max(decSigFigsLat, decSigFigsLong);
      numberOfChars = this.SIGFIG_HASH_LENGTH[numberOfSigFigs];
    } else if (numberOfChars === undefined) {
      numberOfChars = 9;
    }

    var chars = [],
      bits = 0,
      bitsTotal = 0,
      hash_value = 0,
      maxLat = 90,
      minLat = -90,
      maxLon = 180,
      minLon = -180,
      mid;
    while (chars.length < numberOfChars) {
      if (bitsTotal % 2 === 0) {
        mid = (maxLon + minLon) / 2;
        if (longitude > mid) {
          hash_value = (hash_value << 1) + 1;
          minLon = mid;
        } else {
          hash_value = (hash_value << 1) + 0;
          maxLon = mid;
        }
      } else {
        mid = (maxLat + minLat) / 2;
        if (latitude > mid) {
          hash_value = (hash_value << 1) + 1;
          minLat = mid;
        } else {
          hash_value = (hash_value << 1) + 0;
          maxLat = mid;
        }
      }

      bits++;
      bitsTotal++;
      if (bits === 5) {
        var code = this.BASE32_CODES[hash_value];
        chars.push(code);
        bits = 0;
        hash_value = 0;
      }
    }
    return chars.join('');
  }

  encode_int(latitude, longitude, bitDepth) {

    bitDepth = bitDepth || 52;

    var bitsTotal = 0,
      maxLat = 90,
      minLat = -90,
      maxLon = 180,
      minLon = -180,
      mid,
      combinedBits = 0;

    while (bitsTotal < bitDepth) {
      combinedBits *= 2;
      if (bitsTotal % 2 === 0) {
        mid = (maxLon + minLon) / 2;
        if (longitude > mid) {
          combinedBits += 1;
          minLon = mid;
        } else {
          maxLon = mid;
        }
      } else {
        mid = (maxLat + minLat) / 2;
        if (latitude > mid) {
          combinedBits += 1;
          minLat = mid;
        } else {
          maxLat = mid;
        }
      }
      bitsTotal++;
    }
    return combinedBits;
  }

  decode_bbox(hash_string) {
    var isLon = true,
      maxLat = 90,
      minLat = -90,
      maxLon = 180,
      minLon = -180,
      mid;

    var hashValue = 0;
    for (var i = 0, l = hash_string.length; i < l; i++) {
      var code = hash_string[i].toLowerCase();
      hashValue = this.BASE32_CODES_DICT[code];

      for (var bits = 4; bits >= 0; bits--) {
        var bit = (hashValue >> bits) & 1;
        if (isLon) {
          mid = (maxLon + minLon) / 2;
          if (bit === 1) {
            minLon = mid;
          } else {
            maxLon = mid;
          }
        } else {
          mid = (maxLat + minLat) / 2;
          if (bit === 1) {
            minLat = mid;
          } else {
            maxLat = mid;
          }
        }
        isLon = !isLon;
      }
    }
    return [minLat, minLon, maxLat, maxLon];
  }

  decode_bbox_int(hashInt, bitDepth) {

    bitDepth = bitDepth || 52;

    var maxLat = 90,
      minLat = -90,
      maxLon = 180,
      minLon = -180;

    var latBit = 0, lonBit = 0;
    var step = bitDepth / 2;

    for (var i = 0; i < step; i++) {

      lonBit = this.get_bit(hashInt, ((step - i) * 2) - 1);
      latBit = this.get_bit(hashInt, ((step - i) * 2) - 2);

      if (latBit === 0) {
        maxLat = (maxLat + minLat) / 2;
      }
      else {
        minLat = (maxLat + minLat) / 2;
      }

      if (lonBit === 0) {
        maxLon = (maxLon + minLon) / 2;
      }
      else {
        minLon = (maxLon + minLon) / 2;
      }
    }
    return [minLat, minLon, maxLat, maxLon];
  }

  get_bit(bits, position) {
    return (bits / Math.pow(2, position)) & 0x01;
  }

  decode(hashString) {
    var bbox = this.decode_bbox(hashString);
    var lat = (bbox[0] + bbox[2]) / 2;
    var lon = (bbox[1] + bbox[3]) / 2;
    var latErr = bbox[2] - lat;
    var lonErr = bbox[3] - lon;
    return {
      latitude: lat, longitude: lon,
      error: { latitude: latErr, longitude: lonErr }
    }
  }


  decode_int(hash_int, bitDepth) {
    var bbox = this.decode_bbox_int(hash_int, bitDepth);
    var lat = (bbox[0] + bbox[2]) / 2;
    var lon = (bbox[1] + bbox[3]) / 2;
    var latErr = bbox[2] - lat;
    var lonErr = bbox[3] - lon;
    return {
      latitude: lat, longitude: lon,
      error: { latitude: latErr, longitude: lonErr }
    }
  }

  neighbor(hashString, direction) {
    var lonLat = this.decode(hashString);
    var neighborLat = lonLat.latitude
      + direction[0] * lonLat.error.latitude * 2;
    var neighborLon = lonLat.longitude
      + direction[1] * lonLat.error.longitude * 2;
    return this.encode(neighborLat, neighborLon, hashString.length);
  }

  neighbor_int(hash_int, direction, bitDepth) {
    bitDepth = bitDepth || 52;
    var lonlat = this.decode_int(hash_int, bitDepth);
    var neighbor_lat = lonlat.latitude + direction[0] * lonlat.error.latitude * 2;
    var neighbor_lon = lonlat.longitude + direction[1] * lonlat.error.longitude * 2;
    return this.encode_int(neighbor_lat, neighbor_lon, bitDepth);
  }

  neighbors(hashString) {
    const hashStringLength = hashString.length;
    const lonlat = this.decode(hashString);
    const lat = lonlat.latitude;
    const lon = lonlat.longitude;
    const latErr = lonlat.error.latitude * 2;
    const lonErr = lonlat.error.longitude * 2;

    const neighborHashList = [
      this._encodeNeighbor(1, 0),
      this._encodeNeighbor(1, 1),
      this._encodeNeighbor(0, 1),
      this._encodeNeighbor(-1, 1),
      this._encodeNeighbor(-1, 0),
      this._encodeNeighbor(-1, -1),
      this._encodeNeighbor(0, -1),
      this._encodeNeighbor(1, -1),
    ];
    return neighborHashList;
  }

  // Helper function for encoding neighbors
  _encodeNeighbor(neighborLatDir, neighborLonDir) {
    const neighborLat = lat + neighborLatDir * latErr;
    const neighborLon = lon + neighborLonDir * lonErr;
    return this.encode(neighborLat, neighborLon, hashStringLength);
  }

  neighbors_int(hashInt, bitDepth = 52) {
    const lonlat = this.decode_int(hashInt, bitDepth);
    const lat = lonlat.latitude;
    const lon = lonlat.longitude;
    const latErr = lonlat.error.latitude * 2;
    const lonErr = lonlat.error.longitude * 2;

    // Generate neighbor geohashes
    return [
      this.neighbor_int(lat, lon, 1, 0, latErr, lonErr, bitDepth),
      this.neighbor_int(lat, lon, 1, 1, latErr, lonErr, bitDepth),
      this.neighbor_int(lat, lon, 0, 1, latErr, lonErr, bitDepth),
      this.neighbor_int(lat, lon, -1, 1, latErr, lonErr, bitDepth),
      this.neighbor_int(lat, lon, -1, 0, latErr, lonErr, bitDepth),
      this.neighbor_int(lat, lon, -1, -1, latErr, lonErr, bitDepth),
      this.neighbor_int(lat, lon, 0, -1, latErr, lonErr, bitDepth),
      this.neighbor_int(lat, lon, 1, -1, latErr, lonErr, bitDepth),
    ];
  }

  neighbor_int(lat, lon, neighborLatDir, neighborLonDir, latErr, lonErr, bitDepth) {
    const neighborLat = lat + neighborLatDir * latErr;
    const neighborLon = lon + neighborLonDir * lonErr;
    return this.encode_int(neighborLat, neighborLon, bitDepth);
  }


  bboxes(minLat, minLon, maxLat, maxLon, numberOfChars) {
    numberOfChars = numberOfChars || 9;

    var hashSouthWest = this.encode(minLat, minLon, numberOfChars);
    var hashNorthEast = this.encode(maxLat, maxLon, numberOfChars);

    var latLon = this.decode(hashSouthWest);

    var perLat = latLon.error.latitude * 2;
    var perLon = latLon.error.longitude * 2;

    var boxSouthWest = this.decode_bbox(hashSouthWest);
    var boxNorthEast = this.decode_bbox(hashNorthEast);

    var latStep = Math.round((boxNorthEast[0] - boxSouthWest[0]) / perLat);
    var lonStep = Math.round((boxNorthEast[1] - boxSouthWest[1]) / perLon);

    var hashList = [];

    for (var lat = 0; lat <= latStep; lat++) {
      for (var lon = 0; lon <= lonStep; lon++) {
        hashList.push(this.neighbor(hashSouthWest, [lat, lon]));
      }
    }
    return hashList;
  }

  bboxes_int(minLat, minLon, maxLat, maxLon, bitDepth = 52) {
    const hashSouthWest = this.encode_int(minLat, minLon, bitDepth);
    const hashNorthEast = this.encode_int(maxLat, maxLon, bitDepth);

    const latlon = this.decode_int(hashSouthWest, bitDepth);

    const perLat = latlon.error.latitude * 2;
    const perLon = latlon.error.longitude * 2;

    const boxSouthWest = this.decode_bbox_int(hashSouthWest, bitDepth);
    const boxNorthEast = this.decode_bbox_int(hashNorthEast, bitDepth);

    const latStep = Math.round((boxNorthEast[0] - boxSouthWest[0]) / perLat);
    const lonStep = Math.round((boxNorthEast[1] - boxSouthWest[1]) / perLon);

    const hashList = [];

    // Iterate over latitude and longitude ranges to generate geohashes
    for (let lat = 0; lat <= latStep; lat++) {
      for (let lon = 0; lon <= lonStep; lon++) {
        hashList.push(this.neighbor_int(hashSouthWest, [lat, lon], bitDepth));
      }
    }

    return hashList;
  }
}

export default GeohashGrid;
