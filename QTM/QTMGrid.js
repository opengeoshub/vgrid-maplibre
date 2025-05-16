// Reference: https://github.com/paulojraposo/QTM
import * as turf from 'https://cdn.skypack.dev/@turf/turf';

class QTMGrid {
  constructor(map, options = {}) {
    this.map = map;
    this.options = {
      color: options.color || 'rgba(255, 0, 0, 1)',
      width: options.width || 1,
      redraw: options.redraw || 'move',
    };
    this.sourceId = 'qtm-grid';
    this.gridLayerId = 'qtm-grid-layer';
    // this.setBaseCoordinates();
    // this.initializeFacets();
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
        // 'fill-color': 'rgba(255, 0, 0, 1)',
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
    const resolution = Math.floor(zoom) + 1;
    return resolution > 1 ? resolution : 1;
  }

  generateGrid() {
    const zoom = this.map.getZoom();
    const resolution = this.getResolution(zoom);
    const levelFacets = {};
    const QTMID = {};
    const qtmFeatures = [];

    const bounds = this.map.getBounds();
    const bbox = [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()];

    const p90_n180 = [90.0, -180.0];
    const p90_n90 = [90.0, -90.0];
    const p90_p0 = [90.0, 0.0];
    const p90_p90 = [90.0, 90.0];
    const p90_p180 = [90.0, 180.0];

    const p0_n180 = [0.0, -180.0];
    const p0_n90 = [0.0, -90.0];
    const p0_p0 = [0.0, 0.0];
    const p0_p90 = [0.0, 90.0];
    const p0_p180 = [0.0, 180.0];

    const n90_n180 = [-90.0, -180.0];
    const n90_n90 = [-90.0, -90.0];
    const n90_p0 = [-90.0, 0.0];
    const n90_p90 = [-90.0, 90.0];
    const n90_p180 = [-90.0, 180.0];

    for (let lvl = 0; lvl < resolution; lvl++) {
      levelFacets[lvl] = [];
      QTMID[lvl] = [];

      if (lvl === 0) {
        const initialFacets = [
          [p0_n180, p0_n90, p90_n90, p90_n180, p0_n180, true],
          [p0_n90, p0_p0, p90_p0, p90_n90, p0_n90, true],
          [p0_p0, p0_p90, p90_p90, p90_p0, p0_p0, true],
          [p0_p90, p0_p180, p90_p180, p90_p90, p0_p90, true],
          [n90_n180, n90_n90, p0_n90, p0_n180, n90_n180, false],
          [n90_n90, n90_p0, p0_p0, p0_n90, n90_n90, false],
          [n90_p0, n90_p90, p0_p90, p0_p0, n90_p0, false],
          [n90_p90, n90_p180, p0_p180, p0_p90, n90_p90, false],
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
                // const exists = qtmFeatures.some(f => f.properties.qtm_id === qtm_id);
                // if (!exists) {
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
            // }
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


  clampLatLon(lat, lon) {
    lat = Math.max(-89.9999, Math.min(89.9999, lat));
    lon = ((lon + 180) % 360 + 360) % 360 - 180; // Normalize longitude to [-180, 180]
    return [lat, lon];
  }


  toRadians(degrees) {
    return degrees * Math.PI / 180;
  }

  toDegrees(radians) {
    return radians * 180 / Math.PI;
  }

  polygonIntersectsBBox(polygon, bbox) {
    const bboxPoly = turf.bboxPolygon(bbox);
    return turf.booleanIntersects(polygon, bboxPoly);
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
    let vertexTuples;
    if (facet.length === 5) {
      // Triangle facet: [vert, vert, vert, vert, orient]
      vertexTuples = facet.slice(0, 4);
    } else if (facet.length === 6) {
      // Rectangle facet: [vert, vert, vert, vert, vert, northboolean]
      vertexTuples = facet.slice(0, 5);
    }
    // Convert [lat, lon] to [lon, lat] for GeoJSON
    const coordinates = vertexTuples.map(v => [v[1], v[0]]);

    // Ensure the ring is closed
    const first = coordinates[0];
    const last = coordinates[coordinates.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) {
      coordinates.push([...first]);
    }

    return {
      type: "Polygon",
      coordinates: [coordinates]
    };
  }

  divideFacet(aFacet) {
    let newFacet0, newFacet1, newFacet2, newFacet3;

    if (aFacet.length === 5) {
      // Triangle facet
      const orient = aFacet[4];
      const newVerts = [];

      for (let i = 0; i < 3; i++) {
        if (
          aFacet[i][0] === aFacet[i + 1][0] ||
          aFacet[i][1] === aFacet[i + 1][1]
        ) {
          newVerts.push(this.GetMidpoint(aFacet[i], aFacet[i + 1]));
        } else {
          const newLat = (aFacet[i][0] + aFacet[i + 1][0]) / 2;
          const [newLon1, newLon2] = this.findCrossedMeridiansByLatitude(
            aFacet[i],
            aFacet[i + 1],
            newLat
          );
          const newLon = this.lonCheck(newLon1, newLon2, aFacet[i][1], aFacet[i + 1][1]);
          newVerts.push([newLat, newLon]);
        }
      }

      if (orient === "u") {
        newFacet0 = [newVerts[0], newVerts[1], newVerts[2], newVerts[0], "d"];
        newFacet1 = [newVerts[2], newVerts[1], aFacet[2], newVerts[2], "u"];
        newFacet2 = [aFacet[0], newVerts[0], newVerts[2], aFacet[0], "u"];
        newFacet3 = [newVerts[0], aFacet[1], newVerts[1], newVerts[0], "u"];
      } else if (orient === "d") {
        newFacet0 = [newVerts[2], newVerts[0], newVerts[1], newVerts[2], "u"];
        newFacet1 = [aFacet[0], newVerts[0], newVerts[2], aFacet[0], "d"];
        newFacet2 = [newVerts[2], newVerts[1], aFacet[2], newVerts[2], "d"];
        newFacet3 = [newVerts[0], aFacet[1], newVerts[1], newVerts[0], "d"];
      }
    } else if (aFacet.length === 6) {
      // Rectangle facet
      const north = aFacet[5];
      const newVerts = [];

      if (north) {
        for (let i = 0; i < 4; i++) {
          if (i !== 2) {
            if (
              aFacet[i][0] === aFacet[i + 1][0] ||
              aFacet[i][1] === aFacet[i + 1][1]
            ) {
              newVerts.push(this.GetMidpoint(aFacet[i], aFacet[i + 1]));
            } else {
              const newLat = (aFacet[i][0] + aFacet[i + 1][0]) / 2;
              const [newLon1, newLon2] = this.findCrossedMeridiansByLatitude(
                aFacet[i],
                aFacet[i + 1],
                newLat
              );
              const newLon = this.lonCheck(newLon1, newLon2, aFacet[i][1], aFacet[i + 1][1]);
              newVerts.push([newLat, newLon]);
            }
          }
        }

        newFacet0 = [newVerts[0], newVerts[1], newVerts[2], newVerts[0], "d"];
        newFacet1 = [newVerts[2], newVerts[1], aFacet[2], aFacet[3], newVerts[2], true];
        newFacet2 = [aFacet[0], newVerts[0], newVerts[2], aFacet[0], "u"];
        newFacet3 = [newVerts[0], aFacet[1], newVerts[1], newVerts[0], "u"];
      } else {
        for (let i = 0; i < 4; i++) {
          if (i !== 0) {
            if (
              aFacet[i][0] === aFacet[i + 1][0] ||
              aFacet[i][1] === aFacet[i + 1][1]
            ) {
              newVerts.push(this.GetMidpoint(aFacet[i], aFacet[i + 1]));
            } else {
              const newLat = (aFacet[i][0] + aFacet[i + 1][0]) / 2;
              const [newLon1, newLon2] = this.findCrossedMeridiansByLatitude(
                aFacet[i],
                aFacet[i + 1],
                newLat
              );
              const newLon = this.lonCheck(newLon1, newLon2, aFacet[i][1], aFacet[i + 1][1]);
              newVerts.push([newLat, newLon]);
            }
          }
        }

        newFacet0 = [newVerts[2], newVerts[0], newVerts[1], newVerts[2], "u"];
        newFacet1 = [aFacet[0], aFacet[1], newVerts[0], newVerts[2], aFacet[0], false];
        newFacet2 = [newVerts[2], newVerts[1], aFacet[3], newVerts[2], "d"];
        newFacet3 = [newVerts[1], newVerts[0], aFacet[2], newVerts[1], "d"];
      }
    }

    return [newFacet0, newFacet1, newFacet2, newFacet3];
  }
}

export default QTMGrid;