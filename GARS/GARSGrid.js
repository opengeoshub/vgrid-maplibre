class GARSGrid {
  constructor(map, options = {}) {
    this.map = map;
    this.options = {
      color: options.color || 'rgba(255, 0, 0, 1)',
      width: options.width || 1,
      minzoom: options.minzoom || 6,
      redraw: options.redraw || 'move',
    };
    this.sourceId = 'gars-grid';
    this.gridLayerId = 'gars-grid-layer';
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
    // resolution: [1, 5, 15, 30 minutes]
    if (zoom >=  this.options.minzoom && zoom <= 8) return 30;
    if (zoom > 8 && zoom <= 11) return 15;
    if (zoom > 11 && zoom <= 12) return 5;
    if (zoom > 12) return 1;
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

    const lonWidth = resolution/60
    const latWidth = resolution/60
    
    const baseLat = -90;
    const baseLon = -180;

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

        const gars_id = this.latLng2GARS(centroidLat, centroidLon, resolution);
        const exists = features.some(f => f.properties.gars_id === gars_id);
        if (exists) continue;
    
        const feature = {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: coords,
          },
          properties: {
            gars_id: gars_id,
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
