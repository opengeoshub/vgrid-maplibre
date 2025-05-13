// Reference: https://github.com/paulojraposo/QTM
import * as turf from 'https://cdn.skypack.dev/@turf/turf';

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
    this.setBaseCoordinates();
    this.initializeFacets();
    this.initialize();
  }

    setBaseCoordinates() {
    this.p90_n180 = [90.0, -180.0];
    this.p90_n90  = [90.0, -90.0];
    this.p90_p0   = [90.0, 0.0];
    this.p90_p90  = [90.0, 90.0];
    this.p90_p180 = [90.0, 180.0];

    this.p0_n180  = [0.0, -180.0];
    this.p0_n90   = [0.0, -90.0];
    this.p0_p0    = [0.0, 0.0];
    this.p0_p90   = [0.0, 90.0];
    this.p0_p180  = [0.0, 180.0];

    this.n90_n180 = [-90.0, -180.0];
    this.n90_n90  = [-90.0, -90.0];
    this.n90_p0   = [-90.0, 0.0];
    this.n90_p90  = [-90.0, 90.0];
    this.n90_p180 = [-90.0, 180.0];
  }

  initializeFacets() {
    this.initialFacets = {
      '1': [this.p0_n180, this.p0_n90, this.p90_n90, this.p90_n180, this.p0_n180, true],
      '2': [this.p0_n90, this.p0_p0, this.p90_p0, this.p90_n90, this.p0_n90, true],
      '3': [this.p0_p0, this.p0_p90, this.p90_p90, this.p90_p0, this.p0_p0, true],
      '4': [this.p0_p90, this.p0_p180, this.p90_p180, this.p90_p90, this.p0_p90, true],
      '5': [this.n90_n180, this.n90_n90, this.p0_n90, this.p0_n180, this.n90_n180, false],
      '6': [this.n90_n90, this.n90_p0, this.p0_p0, this.p0_n90, this.n90_n90, false],
      '7': [this.n90_p0, this.n90_p90, this.p0_p90, this.p0_p0, this.n90_p0, false],
      '8': [this.n90_p90, this.n90_p180, this.p0_p180, this.p0_p90, this.n90_p90, false],
    };
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
        // 'fill-color': 'rgba(255, 0, 0, 0.5)',
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

  clampLatLon(lat, lon) {
    lat = Math.max(-89.9999, Math.min(89.9999, lat));
    lon = ((lon + 180) % 360 + 360) % 360 - 180; // Normalize longitude to [-180, 180]
    return [lat, lon];
  }
  

  generateGrid() {
    const zoom = this.map.getZoom();
    const resolution = this.getResolution(zoom);
    let lonWidth, latWidth;

    if (resolution === 1) {
      lonWidth = 45;
      latWidth = 45;
    } else if (resolution === 2) {
      lonWidth = 15;
      latWidth = 15;
    } else if (resolution === 3) {
      lonWidth = 10;
      latWidth = 10;
    } else if (resolution > 3) {
      const baseWidth = 10; // at resolution 3
      const factor = Math.pow(0.5, resolution - 3);
      lonWidth = baseWidth * factor;
      latWidth = baseWidth * factor;
    }

    const bounds = this.map.getBounds();
    const minLat = Math.max(bounds.getSouth(), -90);
    const minLon = Math.max(bounds.getWest(), -180);
    const maxLat = Math.min(bounds.getNorth(), 90);
    const maxLon = Math.min(bounds.getEast(), 180);

    const longitudes = [];
    const latitudes = [];

    for (let lon = minLon; lon < maxLon; lon += lonWidth) {
      if (lon >= -180 && lon <= 180) longitudes.push(lon);
    }

    for (let lat = minLat; lat < maxLat; lat += latWidth) {
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
        
        const [safeLat, safeLon] = this.clampLatLon(centroidLat,centroidLon);
        const qtm_id = this.latlonToQtmId(safeLat, safeLon,resolution)
        const exists = features.some(f => f.properties.qtm_id === qtm_id);
        if (exists) continue;

        const facet = this.qtmIdToFacet(qtm_id)
        const coords = this.constructGeometry(facet)  

        // if (coords.find(([lng, _]) => lng > 130)) {
        //   coords = coords.map(([lng, lat]) =>
        //     lng < 0 ? [lng + 360, lat] : [lng, lat]
        //   )};
    
        const feature = {
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

        features.push(feature)
      }
    }

    return {
      type: "FeatureCollection",
      features: features
    };


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
    return coordinates
    // return {
    //   type: "Polygon",
    //   coordinates: [coordinates]
    // };
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

  qtmIdToFacet(qtmId) {
    const baseFacet = this.initialFacets[qtmId[0]];
    if (!baseFacet) {
      throw new Error("Invalid QTM ID: Base facet must be 1–8");
    }

    let facet = baseFacet;
    for (let level = 1; level < qtmId.length; level++) {
      facet = this.divideFacet(facet)[parseInt(qtmId[level], 10)];
    }

    return facet;
  }

 
  pointInPolygon(lat, lon, coords) {
    const point = turf.point([lon, lat]);
    const polygon = turf.polygon([coords]);
    return turf.booleanPointInPolygon(point, polygon);
  }
  
  // The main function to get QTM ID for a given lat, lon, and resolution
  latlonToQtmId(lat, lon, resolution) {
    // Base octahedral face definitions
    const p90_n180 = [90.0, -180.0], p90_n90 = [90.0, -90.0], p90_p0 = [90.0, 0.0], p90_p90 = [90.0, 90.0], p90_p180 = [90.0, 180.0];
    const p0_n180 = [0.0, -180.0], p0_n90 = [0.0, -90.0], p0_p0 = [0.0, 0.0], p0_p90 = [0.0, 90.0], p0_p180 = [0.0, 180.0];
    const n90_n180 = [-90.0, -180.0], n90_n90 = [-90.0, -90.0], n90_p0 = [-90.0, 0.0], n90_p90 = [-90.0, 90.0], n90_p180 = [-90.0, 180.0];

    // Initial 8 facets
    const initialFacets = {
      '1': [[p0_n180, p0_n90, p90_n90, p90_n180, p0_n180], true],
      '2': [[p0_n90, p0_p0, p90_p0, p90_n90, p0_n90], true],
      '3': [[p0_p0, p0_p90, p90_p90, p90_p0, p0_p0], true],
      '4': [[p0_p90, p0_p180, p90_p180, p90_p90, p0_p90], true],
      '5': [[n90_n180, n90_n90, p0_n90, p0_n180, n90_n180], false],
      '6': [[n90_n90, n90_p0, p0_p0, p0_n90, n90_n90], false],
      '7': [[n90_p0, n90_p90, p0_p90, p0_p0, n90_p0], false],
      '8': [[n90_p90, n90_p180, p0_p180, p0_p90, n90_p90], false]
    };
  
    let qtmId = null;
    let currentFacet = null;
  
    // Find the initial facet containing (lat, lon)
    for (const [facetId, [coords, polar]] of Object.entries(initialFacets)) {
      const fixCoords = coords => coords.map(([lat, lon]) => [lon, lat]); 
      const fixed = fixCoords(coords);
       if (this.pointInPolygon(lat, lon, fixed)) {
        qtmId = facetId;
        currentFacet = [coords, polar];
        break;
       }
    }
  
    if (!qtmId) {
      throw new Error("Point is outside the valid range");
    }
  
    // Refine the facet through subdivisions up to the given resolution
    for (let i = 1; i < resolution; i++) {
      const subfacets = this.divideFacet(currentFacet);
      let found = false;
  
      for (let j = 0; j < subfacets.length; j++) {
        const [subCoords, subPolar] = subfacets[j];
        const fixsubCoords = subCoords => subCoords.map(([lat, lon]) => [lon, lat]);
        const fixed = fixsubCoords(subCoords);

         if (this.pointInPolygon(lat, lon, fixed)) {
          qtmId += j.toString();
          currentFacet = [subCoords, subPolar];
          found = true;
          break;
         }
      }
  
      if (!found) {
        throw new Error(`Point not found in any subfacet at level ${i}`);
      }
    }
  
    return qtmId;
  }
  
}

export default QTMGrid;


  // generateGrid() {
  //   const resolution = Math.floor(this.map.getZoom());
  //   console.log(resolution)
  //   const levelFacets = {};
  //   const QTMID = {};
  //   const qtmFeatures = [];

  //   const bounds = this.map.getBounds();
  //   const bbox = [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()];

  //   for (let lvl = 0; lvl < resolution; lvl++) {
  //     levelFacets[lvl] = [];
  //     QTMID[lvl] = [];

  //     if (lvl === 0) {
  //       const initialFacets = [
  //         [[0, -180], [0, -90], [90, -90], [90, -180], [0, -180], "u"],
  //         [[0, -90], [0, 0], [90, 0], [90, -90], [0, -90], "u"],
  //         [[0, 0], [0, 90], [90, 90], [90, 0], [0, 0], "u"],
  //         [[0, 90], [0, 180], [90, 180], [90, 90], [0, 90], "u"],
  //         [[-90, -180], [-90, -90], [0, -90], [0, -180], [-90, -180], "d"],
  //         [[-90, -90], [-90, 0], [0, 0], [0, -90], [-90, -90], "d"],
  //         [[-90, 0], [-90, 90], [0, 90], [0, 0], [-90, 0], "d"],
  //         [[-90, 90], [-90, 180], [0, 180], [0, 90], [-90, 90], "d"],
  //       ];

  //       initialFacets.forEach((facet, i) => {
  //         QTMID[0].push((i + 1).toString());
  //         const facetGeom = this.constructGeometry(facet);
  //         levelFacets[0].push(facet);

  //         if (this.polygonIntersectsBBox(facetGeom, bbox) && resolution === 1) {
  //           const qtm_id = QTMID[0][i];
  //           const coords = facetGeom.coordinates[0];  // Extract the coordinates from the geometry object
  //           const qtmFeature = {
  //             type: 'Feature',
  //             geometry: {
  //               type: 'Polygon',
  //               coordinates: [coords],
  //             },
  //             properties: {
  //               qtm_id: qtm_id,
  //               resolution,
  //             }
  //           };

  //           qtmFeatures.push(qtmFeature);
  //         }
  //       });
  //     } 
  //     else {
  //       levelFacets[lvl - 1].forEach((pf, i) => {
  //         const subdividedFacets = this.divideFacet(pf);
  //         subdividedFacets.forEach((subfacet, j) => {
  //           const subfacetGeom = this.constructGeometry(subfacet);
  //           if (this.polygonIntersectsBBox(subfacetGeom, bbox)) {
  //             const newId = QTMID[lvl - 1][i] + j.toString();
  //             QTMID[lvl].push(newId);
  //             levelFacets[lvl].push(subfacet);
  //             const coords = subfacetGeom.coordinates[0];  // Extract the coordinates from the geometry object

  //             if (lvl === resolution - 1) {
  //               const qtm_id = newId;
  //               const qtmFeature = {
  //                 type: 'Feature',
  //                 geometry: {
  //                   type: 'Polygon',
  //                   coordinates: [coords],
  //                 },
  //                 properties: {
  //                   qtm_id: qtm_id,
  //                   resolution,
  //                 }
  //               };
  //               qtmFeatures.push(qtmFeature);
  //             }
  //           }
  //         });
  //       });
  //     }
  //   }

  //   const geojson_features = {
  //     type: "FeatureCollection",
  //     features: qtmFeatures
  //   };
  //   return geojson_features
  // }


  // setBaseCoordinates() {
  //   this.p90_n180 = [90.0, -180.0];
  //   this.p90_n90  = [90.0, -90.0];
  //   this.p90_p0   = [90.0, 0.0];
  //   this.p90_p90  = [90.0, 90.0];
  //   this.p90_p180 = [90.0, 180.0];

  //   this.p0_n180  = [0.0, -180.0];
  //   this.p0_n90   = [0.0, -90.0];
  //   this.p0_p0    = [0.0, 0.0];
  //   this.p0_p90   = [0.0, 90.0];
  //   this.p0_p180  = [0.0, 180.0];

  //   this.n90_n180 = [-90.0, -180.0];
  //   this.n90_n90  = [-90.0, -90.0];
  //   this.n90_p0   = [-90.0, 0.0];
  //   this.n90_p90  = [-90.0, 90.0];
  //   this.n90_p180 = [-90.0, 180.0];
  // }

  // initializeFacets() {
  //   this.initialFacets = {
  //     '1': [this.p0_n180, this.p0_n90, this.p90_n90, this.p90_n180, this.p0_n180, true],
  //     '2': [this.p0_n90, this.p0_p0, this.p90_p0, this.p90_n90, this.p0_n90, true],
  //     '3': [this.p0_p0, this.p0_p90, this.p90_p90, this.p90_p0, this.p0_p0, true],
  //     '4': [this.p0_p90, this.p0_p180, this.p90_p180, this.p90_p90, this.p0_p90, true],
  //     '5': [this.n90_n180, this.n90_n90, this.p0_n90, this.p0_n180, this.n90_n180, false],
  //     '6': [this.n90_n90, this.n90_p0, this.p0_p0, this.p0_n90, this.n90_n90, false],
  //     '7': [this.n90_p0, this.n90_p90, this.p0_p90, this.p0_p0, this.n90_p0, false],
  //     '8': [this.n90_p90, this.n90_p180, this.p0_p180, this.p0_p90, this.n90_p90, false],
  //   };
  // }

