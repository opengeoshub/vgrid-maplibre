class GARSGrid {
  constructor(map, options = {}) {
    this.latitudeMax = 90;
    this.latitudeMin = -this.latitudeMax;
    this.longitudeMax = 180;
    this.longitudeMin = -this.longitudeMax;
    this.map = map;
    this.options = {
      color: options.color || 'rgba(255, 0, 0, 1)',
      redraw: options.redraw || 'move', // Default to redraw on move
    };
    this.sourceId = 'gars-grid';
    this.gridLayerId = 'gars-grid-layer';
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
        'fill-outline-color': this.options.color
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

  getResolution(zoom) {
    if (zoom >= 10 && zoom < 12) return 1;
    if (zoom >= 12 && zoom < 14) return 2;
    if (zoom >= 14 && zoom < 16) return 3;
    if (zoom >= 16 ) return 4;
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
      lonWidth = 30.0/60; latWidth = 30.0/60; // 30 minutes
      // minLat = this.latitudeMin;
      // minLon = this.longitudeMin;
      // maxLat = this.latitudeMax;
      // maxLon = this.longitudeMin;   
    } else if (resolution === 2) {
      lonWidth = 15.0/60; latWidth = 15.0/60;
    } else if (resolution === 3) {
      lonWidth = 5.0/60; latWidth = 5.0/60;
    } else if (resolution === 4) {
      lonWidth = 1.0/60; latWidth = 1.0/60;
    } else {
      return
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

        if (
          cellMaxLon < minLon || cellMinLon > maxLon ||
          cellMaxLat < minLat || cellMinLat > maxLat
        ) continue;

        const cellCenterLat = (cellMinLat + cellMaxLat) / 2;
        const cellCenterLon = (cellMinLon + cellMaxLon) / 2;

        const gars_id = this.latLng2GARS(cellCenterLat, cellCenterLon);

        const bounds = this.GARS2LatLngBounds(gars_id);

        const coordinates = [[
          [bounds[0][1], bounds[0][0]],
          [bounds[1][1], bounds[0][0]],
          [bounds[1][1], bounds[1][0]],
          [bounds[0][1], bounds[1][0]],
          [bounds[0][1], bounds[0][0]]
        ]];

        const polygon = {
          type: "Polygon",
          coordinates: coordinates,
        };

        features.push({
          type: "Feature",
          properties: {
            gars_id: gars_id,
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

  latLng2GARS(lat, lng) {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    if (lng < this.longitudeMin) {
      lng = this.longitudeMin
    }
    if (lng > this.longitudeMax) {
      lng = this.longitudeMax
    }
    if (lat < this.latitudeMin) {
      lat = this.latitudeMin
    }
    if (lat > this.latitudeMax) {
      lat = this.latitudeMax
    }

    // if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    //   console.error("arguments to latLng2GARS out of bounds");
    //   return -1;
    // }

    let aLat = (lat + 90) * 2;
    let aLng = (lng + 180) * 2;
    const adj = 0.0000001;

    if (aLat === 360) aLat -= adj;
    if (aLat === 0) aLat += adj;
    if (aLng === 0) aLng += adj;
    if (aLng === 720) aLng -= adj;

    let firstThree = Math.ceil(aLng);
    const fourFiveValue = Math.floor(aLat);
    firstThree = ("000" + firstThree).slice(-3);
    let fourFive = chars[Math.floor(fourFiveValue / 24)];
    fourFive += chars[fourFiveValue % 24];
    const subLat = Math.round((aLat - Math.floor(aLat)) * 5);
    const subLng = Math.round((aLng - Math.floor(aLng)) * 5);
    let six = subLng >= 3 ? 2 : 1;
    let seven = (subLng % 3) + 1;
    if (subLat < 3) six += 2;
    seven += (2 - subLat % 3) * 3;
    return firstThree + fourFive + six + seven;
  }

  GARS2LatLngBounds(gars) {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    const bounds = [[0, 0], [0, 0]];

    if (gars.length < 5) {
      console.error("Invalid GARS string");
      return bounds;
    }

    const firstThree = parseInt(gars.substr(0, 3));
    const fourFive = chars.indexOf(gars[3]) * 24 + chars.indexOf(gars[4]);

    bounds[0][0] = fourFive / 2 - 90;
    bounds[1][0] = bounds[0][0] + 0.5;
    bounds[0][1] = firstThree / 2 - 180 - 0.5;
    bounds[1][1] = bounds[0][1] + 0.5;

    if (gars.length > 5) {
      const six = parseInt(gars[5]);
      if (six % 2) bounds[1][1] -= 0.25;
      else bounds[0][1] += 0.25;
      if (six >= 3) bounds[1][0] -= 0.25;
      else bounds[0][0] += 0.25;

      if (gars.length > 6) {
        const seven = parseInt(gars[6]);
        bounds[0][0] += (2 - Math.floor((seven - 1) / 3)) * 0.25 / 3;
        bounds[1][0] -= Math.floor((seven - 1) / 3) * 0.25 / 3;
        bounds[0][1] += ((seven - 1) % 3) * 0.25 / 3;
        bounds[1][1] -= (2 - ((seven - 1) % 3)) * 0.25 / 3;
      }
    }

    return bounds;
  }
}

export default GARSGrid;
