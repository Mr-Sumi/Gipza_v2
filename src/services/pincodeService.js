const axios = require('axios');
const openrouteservice = require('openrouteservice-js');

// Pincode data cache to avoid repeated API calls
const pincodeCache = {};

// Fallback pincode mapping for commonly used pincodes
// Format: [longitude, latitude]
const fallbackPincodeCoordinates = {
  // Major cities in India
  '110001': [77.2090, 28.6139], // Delhi
  '400001': [72.8777, 19.0760], // Mumbai
  '700001': [88.3639, 22.5726], // Kolkata
  '600001': [80.2707, 13.0827], // Chennai
  '500001': [78.4867, 17.3850], // Hyderabad
  '560001': [77.5946, 12.9716], // Bangalore
  '411001': [73.8567, 18.5204], // Pune
  '380001': [72.5714, 23.0225], // Ahmedabad
  '462040': [77.4126, 23.2599], // Bhopal
  // Add more common pincodes as needed
};

// Fallback distance calculation
const getApproximateDistance = (pincode1, pincode2) => {
  // If they're the same, distance is 0
  if (pincode1 === pincode2) return 0;
  
  // If we know the exact distance between these pincodes, return it
  const key = `${pincode1}-${pincode2}`;
  const reverseKey = `${pincode2}-${pincode1}`;
  
  // Predefined distances between specific pincode pairs
  const knownDistances = {
    // Add common route distances here
    '462040-462001': 15.5, // Example: Distance between two areas in Bhopal
  };
  
  if (knownDistances[key]) return knownDistances[key];
  if (knownDistances[reverseKey]) return knownDistances[reverseKey];
  
  // Estimate based on first two digits (postal zone)
  const zone1 = pincode1.substring(0, 2);
  const zone2 = pincode2.substring(0, 2);
  
  if (zone1 === zone2) {
    // Same postal zone, likely within 30km
    return 25;
  } else {
    // Different postal zones, use a default distance
    return 100;
  }
};

/**
 * Get coordinates from pincode using OpenStreetMap Nominatim API
 * @param {string} pincode - 6-digit pincode
 * @returns {Promise<Array>} [longitude, latitude]
 */
async function getCoordinatesFromPincode(pincode) {
  // Return cached coordinates if available
  if (pincodeCache[pincode]) {
    return pincodeCache[pincode];
  }
  
  // Check fallback data first
  if (fallbackPincodeCoordinates[pincode]) {
    const coords = fallbackPincodeCoordinates[pincode];
    pincodeCache[pincode] = coords; // Cache it
    return coords;
  }
  
  const url = `https://nominatim.openstreetmap.org/search?postalcode=${pincode}&country=India&format=json`;

  try {
    console.log(`Fetching coordinates for pincode ${pincode} from API`);
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Gipza/1.0'
      },
      timeout: 5000
    });

    if (response.data && response.data.length > 0) {
      const place = response.data[0];
      const coords = [parseFloat(place.lon), parseFloat(place.lat)];
      
      // Cache the result for future use
      pincodeCache[pincode] = coords;
      
      return coords;
    } else {
      console.warn(`Coordinates not found for PIN code ${pincode} via API, using fallback estimation.`);
      throw new Error(`Coordinates not found for PIN code ${pincode}`);
    }
  } catch (error) {
    console.warn(`Error fetching coordinates for ${pincode}: ${error.message}`);
    throw new Error(`Error fetching coordinates: ${error.message}`);
  }
}

/**
 * Calculate driving distance between two pincodes
 * @param {string} pincode1 - First pincode
 * @param {string} pincode2 - Second pincode
 * @returns {Promise<number>} Distance in kilometers
 */
async function getDrivingDistanceBetweenPincodes(pincode1, pincode2) {
  try {
    // Validate pincode format
    if (!/^\d{6}$/.test(pincode1) || !/^\d{6}$/.test(pincode2)) {
      throw new Error('Invalid pincode format. Must be 6 digits.');
    }

    // Try to get coordinates for both pincodes
    const coords1 = await getCoordinatesFromPincode(pincode1);
    const coords2 = await getCoordinatesFromPincode(pincode2);

    const API_KEY = process.env.OPENROUTESERVICE_API_KEY;
    
    if (!API_KEY) {
      console.warn("OPENROUTESERVICE_API_KEY is not defined, using fallback distance calculation");
      return getApproximateDistance(pincode1, pincode2);
    }

    const Directions = new openrouteservice.Directions({ api_key: API_KEY });

    try {
      const result = await Directions.calculate({
        coordinates: [coords1, coords2],
        profile: 'driving-car',
        format: 'json'
      });

      const distanceMeters = result.routes[0].summary.distance;
      const distanceKm = distanceMeters / 1000;
      return parseFloat(distanceKm.toFixed(2));
    } catch (directionError) {
      console.warn(`Error calculating route: ${directionError.message}, falling back to approximate distance`);
      return getApproximateDistance(pincode1, pincode2);
    }
  } catch (error) {
    // If coordinates cannot be found, use the fallback
    console.warn(`Using fallback distance calculation due to error: ${error.message}`);
    return getApproximateDistance(pincode1, pincode2);
  }
}

module.exports = { 
  getDrivingDistanceBetweenPincodes,
  getCoordinatesFromPincode
};

