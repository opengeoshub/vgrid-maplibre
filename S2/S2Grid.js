//  Reference: https://s2js.org/classes/s2js.s2.Polygon.html
import { s1, s2, geojson } from 'https://esm.sh/s2js'

class S2Grid {
  constructor(map, options = {}) {
    this.map = map;
    this.options = {
      color: options.color || 'rgba(255, 0, 0, 1)',
      width: options.width || 1,
      redraw: options.redraw || 'moveend',
    };
    this.sourceId = 's2-grid';
    this.gridLayerId = 's2-grid-layer';
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
    const min_res = 0;
    const max_res = 30;
    const resolution = Math.min(max_res, Math.max(min_res, Math.floor(zoom)));
    return resolution;
  }

  generateGrid() {
    const bounds = this.map.getBounds();
    const zoom = this.map.getZoom();
    const resolution = this.getResolution(zoom);

    const polygon = {
      type: 'Polygon',
      coordinates: [[
        [bounds.getWest(), bounds.getSouth()],
        [bounds.getEast(), bounds.getSouth()],
        [bounds.getEast(), bounds.getNorth()],
        [bounds.getWest(), bounds.getNorth()],
        [bounds.getWest(), bounds.getSouth()],
      ]],
    };

    const coverer = new geojson.RegionCoverer({
      minLevel: resolution,
      maxLevel: resolution,
    });

    const cellIds = coverer.covering(polygon);

    const features = cellIds.map(cellId => {
      const s2_cell = s2.Cell.fromCellID(cellId);
      let coords = [];

      for (let i = 0; i <= 4; i++) {
        const vertex = s2_cell.vertex(i % 4);
        const latLng = s2.LatLng.fromPoint(vertex);
        const lng = s1.angle.degrees(latLng.lng);
        const lat = s1.angle.degrees(latLng.lat);
        coords.push([lng, lat]);
      }

      // Fix antimeridian crossing 
      if (coords.find(([lng, _]) => lng > 130)) {
        coords = coords.map(([lng, lat]) =>
          lng < 0 ? [lng + 360, lat] : [lng, lat]
        )
      };

      const feature = {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [coords],
        },
        properties: {
          s2_token: s2.cellid.toToken(cellId).toString(),
          resolution,
        }
      };

      return feature;

    });

    return {
      type: 'FeatureCollection',
      features
    };
  }

}
export default S2Grid;
