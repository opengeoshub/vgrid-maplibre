// S2Grid.js

// Function to get the S2 Cell Token from the API
async function getS2CellToken(lat, lon, res) {
  // Construct the API URL with query parameters
  const url = `https://vgridapi2.sovereignsolutions.app/api/latlon2s2?latlonres=${lat},${lon},${res}`;

  try {
      // Make the API request using fetch
      const response = await fetch(url);
      
      // If the response isn't successful, throw an error
      if (!response.ok) {
          throw new Error('Network response was not ok');
      }

      // Parse the JSON response
      const data = await response.json();
      
      // Assuming the response contains a field 'cell_token' with the token value
      const cellToken = data.cell_token;

      console.log('S2 Cell Token:', cellToken);
      return cellToken;
  } catch (error) {
      console.error('There was a problem with the fetch operation:', error);
      return null;  // Return null in case of an error
  }
}

// Example usage of the function
const lat = 10;
const lon = 106;
const resolution = 11;

getS2CellToken(lat, lon, resolution).then(cellToken => {
  if (cellToken) {
      console.log("Retrieved S2 Cell Token:", cellToken);
      // Use the cellToken for further processing, e.g., visualization
  }
});

// Other functions for your grid processing logic can be added below
