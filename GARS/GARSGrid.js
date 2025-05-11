class GARSGrid {
  constructor(map, options = {}) {
    this.latitudeMax = 90;
    this.latitudeMin = -this.latitudeMax;
    this.longitudeMax = 180;
    this.longitudeMin = -this.longitudeMax;
    this.map = map;
    this.options = {
      color: options.color || 'rgba(255, 0, 0, 1)',
      redraw: options.redraw || 'move',
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
        'fill-outline-color': this.options.color,
      },
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
    if (zoom >= 16) return 4;
    return null;
  }

  generateGrid() {
    const zoom = this.map.getZoom();
    const resolution = this.getResolution(zoom);

    const bounds = this.map.getBounds();
    const minLat = bounds.getSouth();
    const minLon = bounds.getWest();
    const maxLat = bounds.getNorth();
    const maxLon = bounds.getEast();

    let lonWidth, latWidth;
    if (resolution === 1) {
      lonWidth = 30.0 / 60;
      latWidth = 30.0 / 60;
    } else if (resolution === 2) {
      lonWidth = 15.0 / 60;
      latWidth = 15.0 / 60;
    } else if (resolution === 3) {
      lonWidth = 5.0 / 60;
      latWidth = 5.0 / 60;
    } else if (resolution === 4) {
      lonWidth = 1.0 / 60;
      latWidth = 1.0 / 60;
    } else {
      throw new Error('Unsupported resolution');
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
        console.log(cellCenterLat)
        console.log(cellCenterLon)

        const gars_id = this.latLng2GARS(cellCenterLat, cellCenterLon, resolution);
        console.log(resolution)
        console.log(gars_id)
        const bounds = this.GARS2LatLngBounds(gars_id);
        const coordinates = [[
          [bounds[0], bounds[1]],
          [bounds[2], bounds[1]],
          [bounds[2], bounds[3]],
          [bounds[0], bounds[3]],
          [bounds[0], bounds[1]],
        ]];

        const feature = {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [coordinates],
          },
          properties: {
            gars_id: gars_id,
            resolution: resolution,
          }
        };
        features.push(feature);
      }
    }
    const geojson_feaures = {
      type: 'FeatureCollection',
      features: features,
    };
    console.log(geojson_feaures)
    return geojson_feaures
  }

  latLng2GARS(latitude, longitude, resolution) {
    const LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';

    longitude = longitude !== 180 ? (longitude + 180) % 360 : 360;
    latitude = latitude !== 90 ? (latitude + 90) % 180 : 179.999999;

    const lonIdx = longitude * 2.0;
    const latIdx = latitude * 2.0;

    const quadrant30min =
      `${String(Math.floor(lonIdx + 1)).padStart(3, '0')}` +
      LETTERS[Math.floor(Math.floor(latIdx) / 24)] +
      LETTERS[Math.floor(latIdx % 24)];

    let quadrant15min = '';
    let quadrant5min = '';
    let quadrant1min = '';

    if (resolution < 30) {
      function indexFromDegrees(numDegrees, inverse = false) {
        const minutes = (numDegrees - Math.floor(numDegrees)) * 60;
        const minutes30 = minutes % 30;
        const minutes15 = minutes % 15;
        const minutes5 = minutes % 5;
        let idx15 = Math.floor(minutes30 / 15.0) + 1;
        let idx5 = Math.floor(minutes15 / 5.0) + 1;
        let idx1 = Math.floor(minutes5) + 1;

        if (inverse) {
          idx15 = 3 - idx15;
          idx5 = 4 - idx5;
          idx1 = 6 - idx1;
        }

        return [idx15, idx5, idx1];
      }

      const [lon15, lon5, lon1] = indexFromDegrees(longitude);
      const [lat15, lat5, lat1] = indexFromDegrees(latitude, true);

      quadrant15min = String((lat15 - 1) * 2 + lon15);

      if (resolution < 15) {
        quadrant5min = String((lat5 - 1) * 3 + lon5);
      }

      if (resolution < 5) {
        quadrant1min = String((lat1 - 1) * 5 + lon1).padStart(2, '0');
      }
    }

    return quadrant30min + quadrant15min + quadrant5min + quadrant1min;
  }

  GARS2LatLngBounds(garsId) {
    const LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';

    const quadrant30min = garsId.slice(0, 5);
    const quadrant15min = garsId.length >= 6 ? parseInt(garsId[5]) : null;
    const quadrant5min = garsId.length >= 7 ? parseInt(garsId[6]) : null;
    const quadrant1min = garsId.length === 9 ? parseInt(garsId.slice(7)) : null;

    function delta15min(q15) {
      if (q15 === null) return [0, 0];
      const lat = [1, 2].includes(q15) ? 15.0 : 0.0;
      const lon = [2, 4].includes(q15) ? 15.0 : 0.0;
      return [lon, lat];
    }

    function delta5min(q5) {
      if (q5 === null) return [0, 0];
      let lon = 0.0, lat = 0.0;
      if ([2, 5, 8].includes(q5)) lon = 5.0;
      else if ([3, 6, 9].includes(q5)) lon = 10.0;

      if ([4, 5, 6].includes(q5)) lat = 5.0;
      else if ([1, 2, 3].includes(q5)) lat = 10.0;
      return [lon, lat];
    }

    function delta1min(q1) {
      if (q1 === null) return [0, 0];
      let lon = 0.0, lat = 0.0;
      if ([2, 7, 12, 17, 22].includes(q1)) lon = 1.0;
      else if ([3, 8, 13, 18, 23].includes(q1)) lon = 2.0;
      else if ([4, 9, 14, 19, 24].includes(q1)) lon = 3.0;
      else if ([5, 10, 15, 20, 25].includes(q1)) lon = 4.0;

      if (q1 <= 5) lat = 4.0;
      else if (q1 <= 10) lat = 3.0;
      else if (q1 <= 15) lat = 2.0;
      else if (q1 <= 20) lat = 1.0;
      return [lon, lat];
    }

    const lonDegrees = ((parseInt(quadrant30min.slice(0, 3)) - 1) / 2.0) - 180;
    const latLetter1 = quadrant30min[3];
    const latLetter2 = quadrant30min[4];
    const latIdx = LETTERS.indexOf(latLetter1) * 24 + LETTERS.indexOf(latLetter2);
    const latDegrees = latIdx * 0.5 - 90;

    let baseLon = lonDegrees;
    let baseLat = latDegrees;

    const [dlon15, dlat15] = delta15min(quadrant15min);
    const [dlon5, dlat5] = delta5min(quadrant5min);
    const [dlon1, dlat1] = delta1min(quadrant1min);

    const minLon = baseLon + dlon15 + dlon5 + dlon1;
    const minLat = baseLat + dlat15 + dlat5 + dlat1;
    const maxLon = minLon + 1.0 / 60;
    const maxLat = minLat + 1.0 / 60;

    return [minLon, minLat, maxLon, maxLat];
  }
}
export default GARSGrid;

// latLng2GARS(lat, lng) {
//   const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ";
//   if (lng < this.longitudeMin) {
//     lng = this.longitudeMin
//   }
//   if (lng > this.longitudeMax) {
//     lng = this.longitudeMax
//   }
//   if (lat < this.latitudeMin) {
//     lat = this.latitudeMin
//   }
//   if (lat > this.latitudeMax) {
//     lat = this.latitudeMax
//   }

//   // if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
//   //   console.error("arguments to latLng2GARS out of bounds");
//   //   return -1;
//   // }

//   let aLat = (lat + 90) * 2;
//   let aLng = (lng + 180) * 2;
//   const adj = 0.0000001;

//   if (aLat === 360) aLat -= adj;
//   if (aLat === 0) aLat += adj;
//   if (aLng === 0) aLng += adj;
//   if (aLng === 720) aLng -= adj;

//   let firstThree = Math.ceil(aLng);
//   const fourFiveValue = Math.floor(aLat);
//   firstThree = ("000" + firstThree).slice(-3);
//   let fourFive = chars[Math.floor(fourFiveValue / 24)];
//   fourFive += chars[fourFiveValue % 24];
//   const subLat = Math.round((aLat - Math.floor(aLat)) * 5);
//   const subLng = Math.round((aLng - Math.floor(aLng)) * 5);
//   let six = subLng >= 3 ? 2 : 1;
//   let seven = (subLng % 3) + 1;
//   if (subLat < 3) six += 2;
//   seven += (2 - subLat % 3) * 3;
//   return firstThree + fourFive + six + seven;
// }

// GARS2LatLngBounds(gars) {
//   const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ";
//   const bounds = [[0, 0], [0, 0]];

//   if (gars.length < 5) {
//     console.error("Invalid GARS string");
//     return bounds;
//   }

//   const firstThree = parseInt(gars.substr(0, 3));
//   const fourFive = chars.indexOf(gars[3]) * 24 + chars.indexOf(gars[4]);

//   bounds[0][0] = fourFive / 2 - 90;
//   bounds[1][0] = bounds[0][0] + 0.5;
//   bounds[0][1] = firstThree / 2 - 180 - 0.5;
//   bounds[1][1] = bounds[0][1] + 0.5;

//   if (gars.length > 5) {
//     const six = parseInt(gars[5]);
//     if (six % 2) bounds[1][1] -= 0.25;
//     else bounds[0][1] += 0.25;
//     if (six >= 3) bounds[1][0] -= 0.25;
//     else bounds[0][0] += 0.25;

//     if (gars.length > 6) {
//       const seven = parseInt(gars[6]);
//       bounds[0][0] += (2 - Math.floor((seven - 1) / 3)) * 0.25 / 3;
//       bounds[1][0] -= Math.floor((seven - 1) / 3) * 0.25 / 3;
//       bounds[0][1] += ((seven - 1) % 3) * 0.25 / 3;
//       bounds[1][1] -= (2 - ((seven - 1) % 3)) * 0.25 / 3;
//     }
//   }

//   return bounds;
// }
