class OLCGrid {
  constructor(map, options = {}) {
    this.map = map;
    this.options = {
      color: options.color || 'rgba(255, 0, 0, 1)',
      width: options.width || 1,
      redraw: options.redraw || 'move',
    };
    this.sourceId = 'olc-grid';
    this.gridLayerId = 'olc-grid-layer';
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

  getResolution(zoom) {
    if (zoom <= 6) return 2;
    if (zoom <= 10) return 4;
    if (zoom <= 14) return 6;
    if (zoom <= 18) return 8;
    if (zoom <= 21) return 10;
    if (zoom <= 23) return 11;
    if (zoom <= 25) return 12;
    if (zoom <= 27) return 13;
    if (zoom <= 29) return 14;
    return 15;
  }

  generateGrid() {
    const zoom = this.map.getZoom();
    const resolution = this.getResolution(zoom);
    const bounds = this.map.getBounds();

    let minLat = bounds.getSouth();
    let minLon = bounds.getWest();
    let maxLat = bounds.getNorth();
    let maxLon = bounds.getEast();

    const area = OpenLocationCode.decode(OpenLocationCode.encode(minLat, minLon, resolution))
    const latWidth = area.latitudeHi - area.latitudeLo
    const lonWidth = area.longitudeHi - area.longitudeLo

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

        const centroidLat = (minLat + maxLat) / 2
        const centroidLon = (minLon + maxLon) / 2

        const olc_id = OpenLocationCode.encode(centroidLat, centroidLon, resolution);
        const exists = features.some(f => f.properties.olc_id === olc_id);
        if (exists) continue;
    
        const coords = [[
          [minLon, minLat],
          [maxLon, minLat],
          [maxLon, maxLat],
          [minLon, maxLat],
          [minLon, minLat] // close polygon
        ]];

        const feature = {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: coords,
          },
          properties: {
            olc_id: olc_id,
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

}
export default OLCGrid;
