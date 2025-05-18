import * as MGRS from 'https://unpkg.com/mgrs/dist/mgrs.esm.js';

class MGRSGrid {
    constructor(map, options = {}) {
        this.map = map;
        this.options = {
            color: options.color || 'rgba(255, 0, 0, 1)',
            width: options.width || 1,
            minzoom: options.minzoom || 6,
            redraw: options.redraw || 'move',
        };
        this.sourceId = 'mgrs-grid';
        this.gridLayerId = 'mgrs-grid-layer';
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
        if (zoom >= this.options.minzoom && zoom < 10) {
            return 0;
        };
        if (zoom < 14) {
            return 1;
        };
        if (zoom < 17) {
            return 2;
        };
        if (zoom <= 20) {
            return 3;
        };
        if (zoom <= 22) {
            return 4;
        };
        if (zoom <= 24) {
            return 5;
        };
        return NaN;
    }

    generateGrid() {
        const bounds = this.map.getBounds();
        const zoom = this.map.getZoom();
        if (zoom >= 6) {
            const resolution = this.getResolution(zoom);

            const minLat = bounds.getSouth();
            const minLon = bounds.getWest();
            const maxLat = bounds.getNorth();
            const maxLon = bounds.getEast();

            let lonWidth, latWidth

            lonWidth = 0.5 * Math.pow(0.1, resolution);
            latWidth = 0.5 * Math.pow(0.1, resolution);

            const baseLat = -90;
            const baseLon = -180;

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
                if (lat >= -80 && lat <= 84) latitudes.push(lat);
            }

            const features = [];

            for (const lon of longitudes) {
                for (const lat of latitudes) {
                    const mgrs_id = MGRS.forward([lon, lat], resolution);
                    const exists = features.some(f => f.properties.mgrs_id === mgrs_id);
                    if (exists) continue;
                    const [west, south, east, north] = MGRS.inverse(mgrs_id);
                    const feature = {
                        type: 'Feature',
                        geometry: {
                            type: 'Polygon',
                            coordinates: [[
                                [west, south],
                                [east, south],
                                [east, north],
                                [west, north],
                                [west, south] // close the ring
                            ]]
                        },
                        properties: {
                            mgrs_id: mgrs_id,
                            resolution: resolution
                        }
                    };
                    features.push(feature);
                }
            }

            const geojson_features = {
                type: 'FeatureCollection',
                features
            };
            // console.log(geojson_features)
            return geojson_features
        }
        else {
            return {}
        }
    }

}
export default MGRSGrid;