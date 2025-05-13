// Reference: https://github.com/paulojraposo/QTM

class QTMGrid {
  constructor(map, options = {}) {
    this.latitudeMax = 90;
    this.latitudeMin = -this.latitudeMax;
    this.longitudeMax = 180;
    this.longitudeMin = -this.longitudeMax;
    this.map = map;
    this.options = {
      color: options.color || 'rgba(255, 0, 0, 1)',
      width: options.width || 1,
      redraw: options.redraw || 'move',
    };
    this.sourceId = 'qtm-grid';
    this.gridLayerId = 'qtm-grid-layer';
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
        // 'fill-outline-color': this.options.color,
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
    return Math.floor(zoom);
  }

  generateGrid() {
    const zoom = Math.floor(this.map.getZoom());
    const resolution = this.getResolution(zoom);
    const levelFacets = {};
    const QTMID = {};
    const qtmFeatures = [];

    const bounds = this.map.getBounds();
    const bbox = [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()];

    for (let lvl = 0; lvl < resolution; lvl++) {
      levelFacets[lvl] = [];
      QTMID[lvl] = [];

      if (lvl === 0) {
        const initialFacets = [
          [[0, -180], [0, -90], [90, -90], [90, -180], [0, -180], "u"],
          [[0, -90], [0, 0], [90, 0], [90, -90], [0, -90], "u"],
          [[0, 0], [0, 90], [90, 90], [90, 0], [0, 0], "u"],
          [[0, 90], [0, 180], [90, 180], [90, 90], [0, 90], "u"],
          [[-90, -180], [-90, -90], [0, -90], [0, -180], [-90, -180], "d"],
          [[-90, -90], [-90, 0], [0, 0], [0, -90], [-90, -90], "d"],
          [[-90, 0], [-90, 90], [0, 90], [0, 0], [-90, 0], "d"],
          [[-90, 90], [-90, 180], [0, 180], [0, 90], [-90, 90], "d"],
        ];

        initialFacets.forEach((facet, i) => {
          QTMID[0].push((i + 1).toString());
          const facetGeom = this.constructGeometry(facet);
          levelFacets[0].push(facet);

          if (this.polygonIntersectsBBox(facetGeom, bbox) && resolution === 1) {
            const qtm_id = QTMID[0][i];
            const coords = facetGeom.coordinates[0];  // Extract the coordinates from the geometry object
            const qtmFeature = {
              type: 'Feature',
              geometry: {
                type: 'Polygon',
                coordinates: [coords],
              },
              properties: {
                qtm_id: qtm_id,
                resolution,
              }
            };

            qtmFeatures.push(qtmFeature);
          }
        });
      } 
      else {
        levelFacets[lvl - 1].forEach((pf, i) => {
          const subdividedFacets = this.divideFacet(pf);
          subdividedFacets.forEach((subfacet, j) => {
            const subfacetGeom = this.constructGeometry(subfacet);
            if (this.polygonIntersectsBBox(subfacetGeom, bbox)) {
              const newId = QTMID[lvl - 1][i] + j.toString();
              QTMID[lvl].push(newId);
              levelFacets[lvl].push(subfacet);
              const coords = subfacetGeom.coordinates[0];  // Extract the coordinates from the geometry object

              if (lvl === resolution - 1) {
                const qtm_id = newId;
                const qtmFeature = {
                  type: 'Feature',
                  geometry: {
                    type: 'Polygon',
                    coordinates: [coords],
                  },
                  properties: {
                    qtm_id: qtm_id,
                    resolution,
                  }
                };
                qtmFeatures.push(qtmFeature);
              }
            }
          });
        });
      }
    }

    const geojson_features = {
      type: "FeatureCollection",
      features: qtmFeatures
    };
    return geojson_features
  }

  toRadians(degrees) {
    return degrees * Math.PI / 180;
  }

  toDegrees(radians) {
    return radians * 180 / Math.PI;
  }
  polygonIntersectsBBox(polygon, bbox) {
    for (const coord of polygon.coordinates[0]) {
      const [lon, lat] = coord;
      if (
        lat >= bbox[1] &&
        lat <= bbox[3] &&
        lon >= bbox[0] &&
        lon <= bbox[2]
      ) {
        return true;
      }
    }
    return false;
  }


  findCrossedMeridiansByLatitude(vert1, vert2, newLat) {
    const theta = this.toRadians(newLat);
    const theta1 = this.toRadians(vert1[0]);
    const lamb1 = this.toRadians(vert1[1]);
    const theta2 = this.toRadians(vert2[0]);
    const lamb2 = this.toRadians(vert2[1]);
    const dlamb = lamb2 - lamb1;

    const x = Math.sin(theta1) * Math.cos(theta2) * Math.cos(theta) * Math.sin(dlamb);
    const y = Math.sin(theta1) * Math.cos(theta2) * Math.cos(theta) * Math.cos(dlamb) -
      Math.cos(theta1) * Math.sin(theta2) * Math.cos(theta);
    const z = Math.cos(theta1) * Math.cos(theta2) * Math.sin(theta) * Math.sin(dlamb);

    const lambm = Math.atan2(-y, x);
    const dlambI = Math.acos(z / Math.sqrt(x * x + y * y));

    const lambI1 = lamb1 + lambm - dlambI;
    const lambI2 = lamb1 + lambm + dlambI;

    const lon1 = (this.toDegrees(lambI1) + 540) % 360 - 180;
    const lon2 = (this.toDegrees(lambI2) + 540) % 360 - 180;

    return [lon1, lon2];
  }

  lonCheck(lon1, lon2, pointlon1, pointlon2) {
    const [lesser, greater] = [pointlon1, pointlon2].sort((a, b) => a - b);
    if (lon1 > lesser && lon1 < greater) return lon1;
    return lon2;
  }

  GetMidpoint(vert1, vert2) {
    const midLat = (vert1[0] + vert2[0]) / 2;
    const midLon = (vert1[1] + vert2[1]) / 2;
    return [midLat, midLon];
  }

  constructGeometry(facet) {
    const vertexTuples = facet.length === 6 ? facet.slice(0, 5) : facet.slice(0, 4);
    const coordinates = vertexTuples.map(vT => [vT[1], vT[0]]);
    coordinates.push(coordinates[0]);
    return {
      type: "Polygon",
      coordinates: [coordinates]
  };
  }

  divideFacet(aFacet) {
    let newFacet0, newFacet1, newFacet2, newFacet3;
    if (aFacet.length === 6 || aFacet.length === 5) {
      const orient = aFacet[aFacet.length - 1];
      const newVerts = [];
      for (let i = 0; i < 3; i++) {
        const [lat1, lon1] = aFacet[i];
        const [lat2, lon2] = aFacet[i + 1];
        if (lat1 === lat2 || lon1 === lon2) {
          newVerts.push(this.GetMidpoint(aFacet[i], aFacet[i + 1]));
        } else {
          const newLat = (lat1 + lat2) / 2;
          const [newLon1, newLon2] = this.findCrossedMeridiansByLatitude(aFacet[i], aFacet[i + 1], newLat);
          const newLon = this.lonCheck(newLon1, newLon2, lon1, lon2);
          newVerts.push([newLat, newLon]);
        }
      }

      if (orient === "u") {
        newFacet0 = [newVerts[0], newVerts[1], newVerts[2], newVerts[0], "d"];
        newFacet1 = [newVerts[2], newVerts[1], aFacet[2], newVerts[2], "u"];
        newFacet2 = [aFacet[0], newVerts[0], newVerts[2], aFacet[0], "u"];
        newFacet3 = [newVerts[0], aFacet[1], newVerts[1], newVerts[0], "u"];
      }

      if (orient === "d") {
        newFacet0 = [newVerts[2], newVerts[0], newVerts[1], newVerts[2], "u"];
        newFacet1 = [aFacet[0], newVerts[0], newVerts[2], aFacet[0], "d"];
        newFacet2 = [newVerts[2], newVerts[1], aFacet[2], newVerts[2], "d"];
        newFacet3 = [newVerts[0], aFacet[1], newVerts[1], newVerts[0], "d"];
      }
    }
    return [newFacet0, newFacet1, newFacet2, newFacet3];
  }

}

export default QTMGrid;
