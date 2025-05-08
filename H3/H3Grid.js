import * as h3 from 'https://unpkg.com/h3-js/dist/h3-js.es.js';

class H3Grid {
    constructor(map, options = {}) {
      this.map = map;
      this.latitudeMax = 90;
      this.latitudeMin = -this.latitudeMax;
      this.longitudeMax = 180;
      this.longitudeMin = -this.longitudeMax;
      this.extraFillArea = 0.5;
      this.map = map;
      this.options = {
        color: options.color || 'rgba(255, 0, 0, 1)',
        redraw: options.redraw || 'move', // Default to redraw on move
      };
      this.sourceId = 'h3-grid';
      this.gridLayerId = 'h3-grid-layer';
      this.labelLayerId = 'h3-label-layer';
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
          'fill-outline-color': ['get', 'color'],
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
  
    // Determine the H3 resolution based on zoom level
    getResolution(zoom) {
      if (zoom <= 3.0) return 0;
      if (zoom <= 4.4) return 1;
      if (zoom <= 5.7) return 2;
      if (zoom <= 7.1) return 3;
      if (zoom <= 8.4) return 4;
      if (zoom <= 9.8) return 5;
      if (zoom <= 11.4) return 6;
      if (zoom <= 12.7) return 7;
      if (zoom <= 14.1) return 8;
      if (zoom <= 15.5) return 9;
      if (zoom <= 16.8) return 10;
      if (zoom <= 18.2) return 11;
      if (zoom <= 19.5) return 12;
      if (zoom <= 21.1) return 13;
      if (zoom <= 21.9) return 14;
      return 15;
    }
  
    // Render hexagons based on current map zoom
    generateGrid() {
      const latitudeMax = 90;
      const latitudeMin = -latitudeMax;
      const longitudeMax = 180;
      const longitudeMin = -longitudeMax;
    
      const extraFillArea = 0.5;
      const hexLayer = 'hex-layer';
      const hexSource = 'hex-source';
      const hexlabelLayer = 'hex-label';
    
      var currentZoom = this.map.getZoom();
      var h3res = this.getResolution(currentZoom);
    
      const iw = window.innerWidth;
      const ih = window.innerHeight;
      const cUL = this.map.unproject([0, 0]).toArray(); // Upper left
      const cLR = this.map.unproject([iw, ih]).toArray(); // Lower right
      const x1 = Math.min(cUL[0], cLR[0]);
      const x2 = Math.max(cUL[0], cLR[0]);
      const y1 = Math.min(cUL[1], cLR[1]);
      const y2 = Math.max(cUL[1], cLR[1]);
      const dh = x2 - x1;
      const dv = y2 - y1;
    
      let x1withBuffer = x1 - dh * extraFillArea;
      let x2withBuffer = x2 + dh * extraFillArea;
      let y1withBuffer = y1 - dv * extraFillArea;
      let y2withBuffer = y2 + dv * extraFillArea;
    
      x1withBuffer = Math.max(x1withBuffer, longitudeMin);
      x2withBuffer = Math.min(x2withBuffer, longitudeMax);
      y1withBuffer = Math.max(y1withBuffer, latitudeMin);
      y2withBuffer = Math.min(y2withBuffer, latitudeMax);
    
      let coordinates = [];
      const xIncrement = 180;
      let lowerX = x1withBuffer;
    
      while (lowerX < longitudeMax && lowerX < x2withBuffer) {
        let upperX = Math.min(lowerX + xIncrement, x2withBuffer, 180);
        coordinates.push([
          [y2withBuffer, lowerX],
          [y2withBuffer, upperX],
          [y1withBuffer, upperX],
          [y1withBuffer, lowerX]
        ]);
        lowerX += xIncrement;
      }
    
      var shapes = [].concat(...coordinates.map(e => h3.polygonToCells(e, h3res)));
      var features = [];
    
      for (var i = 0; i < shapes.length; i++) {
        let cellId = shapes[i];
        let boundary = h3.cellToBoundary(cellId, true);
    
        // Adjust boundary coordinates if they cross the anti-meridian
        if (boundary.find((e) => e[0] < -130) !== undefined) {
          boundary = boundary.map((e) => e[0] > 0 ? [e[0] - 360, e[1]] : e);
        }
        const resolution = h3.getResolution(cellId);
        const edge_unit = resolution > 7 ? h3.UNITS.m : h3.UNITS.km;
        const area_unit = resolution > 7 ? h3.UNITS.m2 : h3.UNITS.km2;
       
        const icosa_faces = h3.getIcosahedronFaces(cellId);
        
        let  area = h3.cellArea(cellId, area_unit);
        area = parseFloat(area.toFixed(1)).toLocaleString();
    
        let  num_hex = h3.getNumCells(h3res);
        num_hex = num_hex.toLocaleString();
    
        features.push({
          "type": "Feature",
          "properties": {
            "color": h3.isPentagon(cellId) ? 'red' : 'blue',
            "h3_id": cellId, // Include the cell ID as a property
            "resolution": resolution,
            "icosa_faces": icosa_faces,
            "area": area,
            "area_unit": area_unit,
            "edge_unit": edge_unit,
            "num_hex": num_hex
          },
          "geometry": {
            "type": "Polygon", // Ensure this is a polygon
            "coordinates": [boundary] // Set the boundary as the polygon's coordinates
          }
        });
      }
      const geojson_features = {
        type: "FeatureCollection",
        features,
      };
      // console.log(geojson_features)
      return geojson_features
    }
  }
  export default H3Grid;