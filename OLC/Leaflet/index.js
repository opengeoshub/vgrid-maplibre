// Set up the map
var map = L.map('map').setView([0, 0], 4);  // Initialize with default center and zoom

// Add OSM base layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Array of polygons/rectangles to be displayed.
var polygons = [];
function clearPolygons() {
  for (var i = 0; i < polygons.length; i++) {
    polygons[i].remove();
  }
  polygons = [];
}

// Array of text labels to be displayed.
var textLabels = [];
function clearTextLabels() {
  for (var i = 0; i < textLabels.length; i++) {
    textLabels[i].remove();
  }
  textLabels = [];
}

/**
  Zoom the map to display a code area. If the zoom level is passed set the
  maps zoom level.

  @param {string} code The OLC code to zoom to the center of.
  @param {zoomLevel} zoomLevel An optional zoom level. If not passed, the zoom
      level is chosen in order to display the entire OLC code area.
*/
function zoomTo(code, zoomLevel) {
  var codeArea = OpenLocationCode.decode(code);
  var center = [codeArea.latitudeCenter, codeArea.longitudeCenter];
  map.setView(center, zoomLevel || map.getZoom());
  var bounds = [
    [codeArea.latitudeLo, codeArea.longitudeLo],
    [codeArea.latitudeHi, codeArea.longitudeHi]
  ];
  map.fitBounds(bounds);
}

/**
  Reformat an OLC code by decoding and encoding the center.

  @param {string} code A valid full OLC code to reformat.
  @return {string} The formatted code.
*/
function formatCode(code) {
  var codeArea = OpenLocationCode.decode(code);
  return OpenLocationCode.encode(
    codeArea.latitudeCenter, codeArea.longitudeCenter, codeArea.codeLength);
}

/**
  Create a rectangle for an OLC code.

  @param {L.Map} map The map to place the polygon on.
  @param {string} code The OLC code to display.
  @param {string} fill The color to use for the outline and fill (CSS syntax).
  @return {L.Rectangle} The rectangle for the code.
*/
function displayOlcArea(map, code, fill) {
  if (typeof fill === 'undefined') {
    fill = '#e51c23';
  }
  var codeArea = OpenLocationCode.decode(code);
  var bounds = [
    [codeArea.latitudeLo, codeArea.longitudeLo],
    [codeArea.latitudeHi, codeArea.longitudeHi]
  ];

  var rectangle = L.rectangle(bounds, {
    color: fill,
    weight: 2,
    fillColor: fill,
    fillOpacity: 0.3
  }).addTo(map);
  
  return rectangle;
}

// Geocoder functions.

function geocodeAddress(olcCode, address, callbackFunction) {
  if (typeof L === 'undefined') {
    return false;
  }
  var geocoder = new L.Control.Geocoder.Nominatim();
  geocoder.geocode(address, function(results) {
    if (results.length === 0) {
      document.getElementById('address').innerHTML = 'Geocoder failed';
      return;
    }
    var latLng = results[0].center;
    callbackFunction(olcCode, address, latLng.lat, latLng.lng);
  });
}

function geocodeLatLng(lat, lng, olcCode, callbackFunction) {
  if (typeof L === 'undefined') {
    return false;
  }
  var geocoder = new L.Control.Geocoder.Nominatim();
  var latLng = L.latLng(lat, lng);
  geocoder.reverse(latLng, 1, function(results) {
    if (results.length === 0) {
      document.getElementById('address').innerHTML = 'Geocoder failed';
      return;
    }
    var address = results[0].address;
    callbackFunction(olcCode, address);
  });
}

// Display an OLC outline and its internal grid.
function OlcStandardGrid(olcCode, lineColor, map) {
  var latLo, latHi, lngLo, lngHi;
  var latSteps = 20;
  var lngSteps = 20;
  var stepDegrees;
  if (olcCode !== '') {
    var codeArea = OpenLocationCode.decode(olcCode);
    latLo = codeArea.latitudeLo;
    latHi = codeArea.latitudeHi;
    lngLo = codeArea.longitudeLo;
    lngHi = codeArea.longitudeHi;
    stepDegrees = (latHi - latLo) / latSteps;
  } else {
    latLo = -90;
    latHi = 90;
    lngLo = -180;
    lngHi = 180;
    stepDegrees = 20;
  }

  this.gridlines_ = [];
  this.labels_ = [];

  // Draw vertical grid lines
  for (var step = 0; step <= lngSteps; step++) {
    var lng = lngLo + step * stepDegrees;
    var path = [
      [latLo, lng],
      [(latLo + latHi) / 2, lng],
      [latHi, lng]
    ];
    var line = L.polyline(path, {
      color: lineColor,
      weight: 2
    }).addTo(map);
    this.gridlines_.push(line);
  }

  // Draw horizontal grid lines
  for (var step = 0; step <= latSteps; step++) {
    var lat = latLo + step * stepDegrees;
    var path = [
      [lat, lngLo],
      [lat, (lngLo + lngHi) / 2],
      [lat, lngHi]
    ];
    var line = L.polyline(path, {
      color: lineColor,
      weight: 2
    }).addTo(map);
    this.gridlines_.push(line);
  }
}

// Clear grid
OlcStandardGrid.prototype.clear = function() {
  for (var i = 0; i < this.gridlines_.length; i++) {
    this.gridlines_[i].remove();
  }
  this.gridlines_ = [];
  for (var i = 0; i < this.labels_.length; i++) {
    this.labels_[i].remove();
  }
  this.labels_ = [];
};
