class OLCGrid {
  constructor(map, options = {}) {
    this.map = map;
    this.options = {
      color: options.color || 'rgba(255, 0, 0, 1)',
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
    if (zoom <= 4) return 2;
    if (zoom <= 9) return 4;
    if (zoom <= 12) return 6;
    if (zoom <= 14) return 8;
    if (zoom <= 16) return 10;
    if (zoom <= 18) return 11;
    if (zoom <= 20) return 12;
    if (zoom <= 22) return 13;
    if (zoom <= 24) return 14;
    return 15;
  }

  generateGrid() {
    const bounds = this.map.getBounds();
    const zoom = this.map.getZoom();
    const resolution = this.getResolution(zoom);
    const swLat = bounds.getSouthWest().lat;
    const swLng = bounds.getSouthWest().lng;
    const neLat = bounds.getNorthEast().lat;
    const neLng = bounds.getNorthEast().lng;

    const area = OpenLocationCode.decode(OpenLocationCode.encode(swLat, swLng, resolution))
    const latStep = area.latitudeHi - area.latitudeLo
    const lngStep = area.longitudeHi - area.longitudeLo
    const olcFeatures = [];

    for (let lat = swLat; lat < neLat; lat += latStep) {
      for (let lng = swLng; lng < neLng; lng += lngStep) {
        const centerLat = lat + latStep / 2;
        const centerLng = lng + lngStep / 2;

        const olcId = OpenLocationCode.encode(centerLat, centerLng, resolution);
        const decoded = OpenLocationCode.decode(olcId);
        const codeLength = decoded.codeLength;

        const cellPolygon = {
          type: "Polygon",
          coordinates: [[
            [lng, lat],                       // SW
            [lng, lat + latStep],             // NW
            [lng + lngStep, lat + latStep],   // NE
            [lng + lngStep, lat],             // SE
            [lng, lat]                        // Close polygon
          ]],
          properties: {
            olc_id: olcId,
            resolution,
          }

        };

        const olcFeature = {
          type: "Feature",
          geometry: cellPolygon,
          properties: {
            olc_id: olcId,
            resolution,
          }
        };
        olcFeatures.push(olcFeature);
      }
    }

    return {
      type: "FeatureCollection",
      features: olcFeatures
    };
  }

}
export default OLCGrid;
