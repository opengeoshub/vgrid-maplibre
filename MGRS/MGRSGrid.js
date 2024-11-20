class MGRSGrid {
    constructor(map, options = {}) {
        this.map = map;
        this.options = Object.assign({
            lineColor: '#111',
            lineWidth: 1,
            labelColor: '#000',
            labelSize: 12,
            labelHaloColor: '#fff',
            labelHaloWidth: 1,
            gridInterval: [100000, 10000, 1000], // Intervals for grid spacing at different zooms
            minZoom: 5,
            maxZoom: 18
        }, options);
        this.gridSourceId = 'mgrs-grid-source';
        this.gridLineLayerId = 'mgrs-grid-lines';
        this.gridLabelLayerId = 'mgrs-grid-labels';

        this.map.on('load', () => {
            this.initGrid();
            this.updateGrid(); // Update grid after map is loaded
        });

        this.map.on('move', () => this.updateGrid());
        this.map.on('styledata', () => this.initGrid()); // Listen for style data loading
    }

    initGrid() {
        // Only proceed if the map is fully loaded and the style is applied
        if (!this.map.isStyleLoaded()) {
            this.map.on('load', this.initGrid.bind(this));  // Retry once the map is fully loaded
            return;
        }

        // Create source if it does not exist yet
        if (!this.map.getSource(this.gridSourceId)) {
            this.map.addSource(this.gridSourceId, {
                type: 'geojson',
                data: {
                    type: 'FeatureCollection',
                    features: []
                }
            });

            // Add grid lines
            this.map.addLayer({
                id: this.gridLineLayerId,
                type: 'line',
                source: this.gridSourceId,
                paint: {
                    'line-color': this.options.lineColor,
                    'line-width': this.options.lineWidth
                }
            });

            // Add grid labels
            this.map.addLayer({
                id: this.gridLabelLayerId,
                type: 'symbol',
                source: this.gridSourceId,
                layout: {
                    'text-field': ['get', 'label'],
                    'text-size': this.options.labelSize,
                    'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
                    'symbol-placement': 'point'
                },
                paint: {
                    'text-color': this.options.labelColor,
                    'text-halo-color': this.options.labelHaloColor,
                    'text-halo-width': this.options.labelHaloWidth
                }
            });
        }
    }

    updateGrid() {
        // Check if the source exists before trying to update it
        if (!this.map.getSource(this.gridSourceId)) {
            return; // The source is not available, return early
        }

        const zoom = this.map.getZoom();
        if (zoom < this.options.minZoom || zoom > this.options.maxZoom) {
            this.map.getSource(this.gridSourceId).setData({ type: 'FeatureCollection', features: [] });
            return;
        }

        const bounds = this.map.getBounds();
        const interval = this._getGridInterval(zoom);
        const features = this._generateGrid(bounds, interval);

        this.map.getSource(this.gridSourceId).setData({
            type: 'FeatureCollection',
            features: features
        });
    }

    _getGridInterval(zoom) {
        if (zoom >= 13) return this.options.gridInterval[2]; // Small grid
        if (zoom >= 9) return this.options.gridInterval[1];  // Medium grid
        return this.options.gridInterval[0];                // Large grid
    }

    _generateGrid(bounds, interval) {
        const features = [];
        const startX = Math.floor(bounds.getWest() / interval) * interval;
        const endX = Math.ceil(bounds.getEast() / interval) * interval;
        const startY = Math.floor(bounds.getSouth() / interval) * interval;
        const endY = Math.ceil(bounds.getNorth() / interval) * interval;
    
        // Create vertical grid lines
        for (let x = startX; x <= endX; x += interval) {
            features.push({
                type: 'Feature',
                geometry: {
                    type: 'LineString',
                    coordinates: [[x, startY], [x, endY]]
                }
            });
        }
    
        // Create horizontal grid lines
        for (let y = startY; y <= endY; y += interval) {
            features.push({
                type: 'Feature',
                geometry: {
                    type: 'LineString',
                    coordinates: [[startX, y], [endX, y]]
                }
            });
        }
    
        // Add grid labels
        for (let x = startX; x <= endX; x += interval) {
            for (let y = startY; y <= endY; y += interval) {
                const mgrsLabel = mgrs.forward([x, y]);
                features.push({
                    type: 'Feature',
                    properties: { label: mgrsLabel },
                    geometry: { type: 'Point', coordinates: [x, y] }
                });
            }
        }
    
        return features;
    }
}
