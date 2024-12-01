// Import the S2 functions if using modules
// Otherwise, make sure the S2 functions are globally accessible
class S2Grid {
  constructor(level) {
      this.level = level; // Define the S2 cell level for the grid
  }

  /**
   * Generate an S2Cell from latitude and longitude.
   * @param {number} lat Latitude in degrees.
   * @param {number} lng Longitude in degrees.
   * @returns {Object} S2Cell object.
   */
  generateCell(lat, lng) {
      const latLng = S2.L.LatLng(lat, lng);
      return S2.S2Cell.FromLatLng(latLng, this.level);
  }

  /**
   * Generate a grid of S2 cells for a bounding box.
   * @param {number} minLat Minimum latitude of the bounding box.
   * @param {number} minLng Minimum longitude of the bounding box.
   * @param {number} maxLat Maximum latitude of the bounding box.
   * @param {number} maxLng Maximum longitude of the bounding box.
   * @returns {Array} List of S2Cell objects covering the bounding box.
   */
  generateGrid(minLat, minLng, maxLat, maxLng) {
      const cells = [];
      const step = 1 / Math.pow(2, this.level); // Approximate step size based on level

      for (let lat = minLat; lat <= maxLat; lat += step) {
          for (let lng = minLng; lng <= maxLng; lng += step) {
              const cell = this.generateCell(lat, lng);
              cells.push(cell);
          }
      }

      return cells;
  }

  /**
   * Visualize the S2 grid cells.
   * @param {Array} cells Array of S2Cell objects.
   * @returns {Array} GeoJSON objects representing the cells.
   */
  visualizeGrid(cells) {
      return cells.map((cell) => {
          const vertices = this.getCellVertices(cell);
          return {
              type: 'Feature',
              geometry: {
                  type: 'Polygon',
                  coordinates: [vertices],
              },
              properties: {
                  id: cell.id,
              },
          };
      });
  }

  /**
   * Get the vertices of an S2 cell as [lat, lng] coordinates.
   * @param {Object} cell S2Cell object.
   * @returns {Array} Array of [lat, lng] pairs.
   */
  getCellVertices(cell) {
      const vertices = [];
      for (let i = 0; i < 4; i++) {
          const xyz = S2.FaceUVToXYZ(cell.face, cell.getVertexUV(i));
          const latLng = S2.XYZToLatLng(xyz);
          vertices.push([latLng.lat, latLng.lng]);
      }
      // Close the polygon by repeating the first vertex
      vertices.push(vertices[0]);
      return vertices;
  }
}

export default S2Grid;