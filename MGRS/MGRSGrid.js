import * as MGRS from 'https://unpkg.com/mgrs/dist/mgrs.esm.js';

class MGRSGrid {
    constructor(map, options = {}) {
        this.map = map;
        this.options = {
            redraw: options.redraw || 'move',
            color: options.color || 'rgba(255, 0, 0, 1)',
            // gridInterval: [100000, 10000, 1000], // Intervals for grid spacing at different zooms
            coordinateGridSpacing: [
                20.0, // 0
                20.0, // 1
                20.0, // 2
                10.0, // 3
                5.0, // 4
                5.0, // 5
                2.0, // 6
                1.0, // 7
                1.0, // 8
                0.5, // 9
                0.25, // 10
                0.10, // 11
                0.05, // 12
                0.05, // 13
                0.01, // 14
                0.01, // 15
                0.01, // 16
                0.01, // 17
                0.01, // 18
            ]
        };
        this.sourceId = 'mgrs-grid';
        this.gridLayerId = 'mgrs-grid-layer';
        this.initialize();
    }

    // initialize() {
    //     this.map.addSource(this.sourceId, {
    //         type: 'geojson',
    //         data: this.generateGrid(),
    //     });

    //     this.map.addLayer({
    //         id: this.gridLayerId,
    //         source: this.sourceId,
    //         type: 'fill',
    //         layout: {},
    //         paint: {
    //             'fill-color': 'transparent',
    //             'fill-opacity': 1,
    //             'fill-outline-color': this.options.color
    //         }
    //     });

    //     this.map.on(this.options.redraw, () => this.updateGrid());
    // }
    initialize() {
        this.map.addSource(this.sourceId, {
            type: 'geojson',
            data: this.generateGrid(),
        });
    
        this.map.addLayer({
            id: this.gridLayerId,
            source: this.sourceId,
            type: 'line',
            layout: {},
            paint: {
                'line-color': this.options.color || '#ff0000',
                'line-width':  1
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

    getGridSpacing(zoom) {
        if (zoom > 18) { zoom = 18 }
        return this.options.coordinateGridSpacing[zoom];
    }
    
    getResolution(zoom) {
        if ( zoom < 10 ) {
            return 0;
        };
        if ( zoom < 14 ) {
            return 1;
        };
        if ( zoom < 17 )  {
            return 2;
        };
        if ( zoom<= 20 )  {
            return 3;
        };
        return NaN;
    }

    generateGrid() {
        const bounds = this.map.getBounds();
        const zoom = this.map.getZoom();
    
        if (zoom < 3) return { type: 'FeatureCollection', features: [] };
    
        const metersPerPixel = (lat, zoom) => {
            const earthCircumference = 40075016.686; // in meters
            return earthCircumference * Math.cos(lat * Math.PI / 180) / (Math.pow(2, zoom + 8));
        };
    
        const llToMeters = (lat, lon) => {
            const x = lon * 20037508.34 / 180;
            const y = Math.log(Math.tan((90 + lat) * Math.PI / 360)) / (Math.PI / 180);
            return {
                x: x,
                y: y * 20037508.34 / 180
            };
        };
    
        const metersToLL = (x, y) => {
            const lon = x * 180 / 20037508.34;
            const lat = 180 / Math.PI * (2 * Math.atan(Math.exp(y * Math.PI / 20037508.34)) - Math.PI / 2);
            return {
                lat: lat,
                lon: lon
            };
        };
    
        const center = this.map.getCenter();
        const centerMeters = llToMeters(center.lat, center.lng);
        const gridSizeMeters = 100000; // adjust this per zoom if needed
    
        const boundsSw = bounds.getSouthWest();
        const boundsNe = bounds.getNorthEast();
        const swMeters = llToMeters(boundsSw.lat, boundsSw.lng);
        const neMeters = llToMeters(boundsNe.lat, boundsNe.lng);
    
        const features = [];
    
        // Horizontal lines
        let yUp = centerMeters.y;
        let yDown = centerMeters.y;
        while (yUp < neMeters.y || yDown > swMeters.y) {
            for (let y of [yUp, yDown]) {
                if (y >= swMeters.y && y <= neMeters.y) {
                    const left = metersToLL(swMeters.x, y);
                    const right = metersToLL(neMeters.x, y);
                    features.push({
                        type: 'Feature',
                        geometry: {
                            type: 'LineString',
                            coordinates: [
                                [left.lon, left.lat],
                                [right.lon, right.lat]
                            ]
                        },
                        properties: {
                            type: 'horizontal'
                        }
                    });
                }
            }
            yUp += gridSizeMeters;
            yDown -= gridSizeMeters;
        }
    
        // Vertical lines
        let xRight = centerMeters.x;
        let xLeft = centerMeters.x;
        while (xRight < neMeters.x || xLeft > swMeters.x) {
            for (let x of [xRight, xLeft]) {
                if (x >= swMeters.x && x <= neMeters.x) {
                    const top = metersToLL(x, neMeters.y);
                    const bottom = metersToLL(x, swMeters.y);
                    features.push({
                        type: 'Feature',
                        geometry: {
                            type: 'LineString',
                            coordinates: [
                                [top.lon, top.lat],
                                [bottom.lon, bottom.lat]
                            ]
                        },
                        properties: {
                            type: 'vertical'
                        }
                    });
                }
            }
            xRight += gridSizeMeters;
            xLeft -= gridSizeMeters;
        }
    
        const geojson_features =  {
            type: 'FeatureCollection',
            features
        };
        console.log (geojson_features)
        return geojson_features
    }
    
    // generateGrid() {
    //     const bounds = this.map.getBounds();
    //     const zoom = this.map.getZoom();
    //     const resolution = this.getResolution(zoom);
    //     const interval = this.getGridSpacing(zoom);
    //     // console.log(interval)
    //     const features = [];
    //     let startX = bounds.getWest();
    //     let endX = bounds.getEast();
    //     let startY = bounds.getSouth();
    //     let endY = bounds.getNorth();

    //     if (startX < -180) {
    //         startX = -180
    //     }
    //     if (endX > 180) {
    //         endX = 180
    //     }
    //     if (startY < -80) {
    //         startY = -80
    //     }
    //     if (endY > 84) {
    //         endY = 84
    //     }

    //     for (let x = startX; x <= endX; x += interval) {
    //         for (let y = startY; y <= endY; y += interval) {
    //             const mgrsID = MGRS.forward([x, y], resolution);
    //             const [west, south, east, north] = MGRS.inverse(mgrsID);
    //             const feature = {
    //                 type: 'Feature',
    //                 geometry: {
    //                     type: 'Polygon',
    //                     coordinates: [[
    //                         [west, south],
    //                         [east, south],
    //                         [east, north],
    //                         [west, north],
    //                         [west, south] // close the ring
    //                     ]]
    //                 },
    //                 properties: {
    //                     mgrs_id: mgrsID,
    //                     resolution: resolution
    //                 }
    //             };
    //             features.push(feature);
    //         }
    //     }

    // const geojson_features = {
    //     type: 'FeatureCollection',
    //     features
    // };
    // console.log(geojson_features)
    // return geojson_features
    // }
}
export default MGRSGrid;