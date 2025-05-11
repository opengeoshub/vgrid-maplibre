//  Reference: https://a5geo.org/
import * as A5 from 'https://unpkg.com/a5-js/dist/a5.es.js';

class A5Grid {
  constructor(map, options = {}) {
    this.map = map;
    this.options = {
      redraw: options.redraw || 'move',
      color: options.color || 'rgba(255, 0, 0, 1)'
    };
    this.sourceId = 'a5-grid';
    this.gridLayerId = 'a5-grid-layer';
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
    const resolution = Math.floor(zoom);
    return resolution > 1 ? resolution : 1;
  }

  generateGrid() {
    const center = this.map.getCenter(); // {lng, lat}
    const zoom = this.map.getZoom();
    const resolution = this.getResolution(zoom);

    const cellId = A5.lonLatToCell([center.lng, center.lat], resolution);
    const boundary = A5.cellToBoundary(cellId); // Array of [lng, lat] pairs
    const coordinates = [[...boundary, boundary[0]]];
    console.log(coordinates)
  
    const features = [];
    
    const feature = {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: coordinates,
      },
      properties: {
        a5_id: A5.bigIntToHex(cellId),
        resolution
      },
    };
    console.log(feature)
    features.push(feature)
    const geojson_features = {
      type: "FeatureCollection",
      features,
    };
    return geojson_features
  }
}

export default A5Grid;
// export { A5 };
