const axios = require('axios');
const Product = require('../models/Product');
const Vendor = require('../models/Vendor');
const delhiveryConfig = require('../config/delhivery');

/**
 * Validate pincode format (6 digits)
 */
const validatePincode = (pincode) => {
  return /^\d{6}$/.test(pincode);
};

/**
 * Check pincode serviceability via Delhivery API
 * @param {string} pincode - Destination pincode
 * @returns {Promise<object>} { serviceable: boolean, message: string }
 */
const checkServiceability = async (pincode) => {
  if (!validatePincode(pincode)) {
    throw new Error('Invalid pincode format. Must be 6 digits.');
  }

  if (!delhiveryConfig.isConfigured()) {
    // Fallback: return serviceable if API key not configured
    console.warn('Delhivery API key not configured. Returning default serviceability.');
    return {
      serviceable: true,
      message: 'Serviceability check unavailable (API key not configured)',
    };
  }

  try {
    const response = await axios.get(`${delhiveryConfig.config.baseUrl}${delhiveryConfig.endpoints.checkServiceability}`, {
      params: {
        filter_codes: pincode,
      },
      headers: delhiveryConfig.getAuthHeaders(),
      timeout: 10000,
    });

    const data = response.data;
    if (data && data.delivery_codes && data.delivery_codes.length > 0) {
      const pincodeData = data.delivery_codes[0];
      return {
        serviceable: pincodeData.pre_paid === 'Y' || pincodeData.cod === 'Y',
        message: pincodeData.pre_paid === 'Y' || pincodeData.cod === 'Y' 
          ? 'Pincode is serviceable' 
          : 'Pincode is not serviceable',
      };
    }

    return {
      serviceable: false,
      message: 'Pincode not found in serviceable areas',
    };
  } catch (error) {
    console.error('Error checking serviceability:', error.message);
    // Fallback: assume serviceable if API fails
    return {
      serviceable: true,
      message: 'Serviceability check failed. Assuming serviceable.',
    };
  }
};

/**
 * Calculate shipping cost
 * Simplified version - can be enhanced with full Delhivery integration
 * @param {string} destinationPincode - Customer delivery pincode
 * @param {number} totalWeightKg - Total weight in KG
 * @param {string} paymentMode - 'Prepaid' or 'COD'
 * @param {number} orderValue - Order value in rupees
 * @param {string} originPincode - Vendor pickup pincode
 * @returns {Promise<object>} { serviceable: boolean, cost: number, estimatedDelivery: number }
 */
const calculateShipping = async (destinationPincode, totalWeightKg, paymentMode, orderValue, originPincode) => {
  if (!validatePincode(destinationPincode) || !validatePincode(originPincode)) {
    throw new Error('Invalid pincode format. Must be 6 digits.');
  }

  if (!delhiveryConfig.isConfigured()) {
    // Fallback: return default shipping cost if API key not configured
    console.warn('Delhivery API key not configured. Using default shipping cost.');
    return {
      serviceable: true,
      cost: 50, // Default shipping cost
      estimatedDelivery: 5, // Default delivery days
    };
  }

  const weightGrams = Math.max(500, Math.round(totalWeightKg * 1000)); // Minimum 500g

  try {
    const response = await axios.get(`${delhiveryConfig.config.baseUrl}${delhiveryConfig.endpoints.calculateShipping}`, {
      params: {
        md: 'S', // S = Surface, E = Express
        ss: 'Delivered',
        d_pin: destinationPincode,
        o_pin: originPincode,
        cgm: weightGrams,
        pt: paymentMode === 'COD' ? 'COD' : 'Pre-paid',
        cod: paymentMode === 'COD' ? orderValue : 0,
      },
      headers: delhiveryConfig.getAuthHeaders(),
      timeout: 10000,
    });

    const rateData = Array.isArray(response.data) ? response.data[0] : response.data;

    if (rateData.status === 'error' || rateData.serviceable === false) {
      return {
        serviceable: false,
        cost: 0,
        estimatedDelivery: 0,
        message: rateData.remarks || 'Shipping not available to this pincode',
      };
    }

    const cost = parseFloat(rateData.total_amount) || 50;
    const estimatedDelivery = rateData.edd ? parseInt(rateData.edd.split(' ')[0]) || 5 : 5;

    return {
      serviceable: true,
      cost,
      estimatedDelivery,
    };
  } catch (error) {
    console.error('Error calculating shipping:', error.message);
    // Fallback: return default shipping cost
    return {
      serviceable: true,
      cost: 50,
      estimatedDelivery: 5,
      message: 'Shipping calculation failed. Using default cost.',
    };
  }
};

/**
 * Calculate shipping cost for a product
 * Handles both manual (distance-based) and automatic (Delhivery) delivery modes
 * @param {string} productId - Product ID
 * @param {string} zipCode - Destination zip code
 * @param {number} quantity - Product quantity
 * @param {string} paymentMethod - Payment method ('Prepaid' or 'COD')
 * @returns {Promise<object>} Shipping cost details
 */
const calculateShippingCost = async (productId, zipCode, quantity = 1, paymentMethod = 'Prepaid') => {
  const product = await Product.findById(productId)
    .select('weight vendor sellingPrice deliveryMode deliverablePincodes distanceBasedDelivery')
    .populate('vendor', 'pincode name');

  if (!product) {
    throw new Error('Product not found');
  }

  if (!product.vendor) {
    throw new Error('Product vendor information not available');
  }

  const productWeight = product.weight || 0.1; // Default 0.1kg
  const totalWeight = Math.max(productWeight * quantity, 0.5); // Minimum 0.5kg
  const orderValue = product.sellingPrice * quantity;
  const vendorPincode = product.vendor.pincode;

  if (!vendorPincode) {
    throw new Error('Vendor pincode not available');
  }

  const deliveryMode = product.deliveryMode || 'manual';
  const isManualOnly = deliveryMode === 'manual';
  const isAutomaticOnly = deliveryMode === 'automatic';
  const isCombined = deliveryMode === 'automatic+manual' || deliveryMode === 'manual+automatic';

  // Check deliverable pincodes if product has them configured
  if (product.deliverablePincodes && product.deliverablePincodes.length > 0) {
    const isPincodeAllowed = product.deliverablePincodes.some(
      (pincode) => (typeof pincode === 'object' ? pincode.code : pincode) === zipCode
    );

    if (!isPincodeAllowed) {
      return {
        serviceable: false,
        cost: 0,
        message: `Delivery not available to pincode ${zipCode}. Please try a different address.`,
      };
    }
  }

  // Handle manual delivery (for manual-only or combined modes)
  if (isManualOnly || isCombined) {
    try {
      const manualResult = await handleManualDelivery(product, zipCode, vendorPincode);
      
      // If manual delivery is successful, return it
      if (manualResult.serviceable) {
        return {
          ...manualResult,
          deliveryMode: 'manual',
        };
      }
      
      // For manual-only mode, if manual fails, return error
      if (isManualOnly) {
        return manualResult;
      }
      
      // For combined mode, if manual fails, try automatic (will fall through)
      console.log(`Manual delivery not available: ${manualResult.message}. Trying automatic delivery...`);
    } catch (manualError) {
      console.error(`Error calculating manual delivery: ${manualError.message}`);
      
      // For manual-only mode, return error
      if (isManualOnly) {
        return {
          serviceable: false,
          cost: 0,
          message: `Manual delivery calculation failed: ${manualError.message}`,
        };
      }
      
      // For combined mode, continue to automatic delivery
    }
  }

  // Handle automatic delivery (for automatic-only or combined modes where manual failed)
  if (isAutomaticOnly || (isCombined && !isManualOnly)) {
    try {
      const shippingDetails = await calculateShipping(
        zipCode,
        totalWeight,
        paymentMethod === 'COD' ? 'COD' : 'Pre-paid',
        orderValue,
        vendorPincode
      );

      if (shippingDetails.serviceable) {
        return {
          ...shippingDetails,
          deliveryMode: 'automatic',
        };
      }
    } catch (autoError) {
      console.error(`Error calculating automatic delivery: ${autoError.message}`);
    }
  }

  // If we reach here, delivery is not available
  return {
    serviceable: false,
    cost: 0,
    message: `Delivery not available to pincode ${zipCode} for this product.`,
  };
};

/**
 * Handle manual delivery calculation based on distance ranges
 * @param {Object} product - Product document
 * @param {string} userPincode - Customer delivery pincode
 * @param {string} vendorPincode - Vendor warehouse pincode
 * @returns {Promise<object>} Delivery details
 */
const handleManualDelivery = async (product, userPincode, vendorPincode) => {
  const { getDrivingDistanceBetweenPincodes } = require('./pincodeService');
  
  // Check if distance-based delivery is enabled
  const distanceConfig = product.distanceBasedDelivery;
  const ranges = Array.isArray(distanceConfig?.ranges) ? distanceConfig.ranges : [];
  const rangesEnabled = Boolean(distanceConfig?.enabled) && ranges.length > 0;

  if (!rangesEnabled) {
    return {
      serviceable: false,
      cost: 0,
      message: 'Manual delivery not available: no delivery ranges configured',
    };
  }

  // Calculate distance between pincodes
  const distance = await getDrivingDistanceBetweenPincodes(userPincode, vendorPincode);
  console.log(`Distance between ${vendorPincode} and ${userPincode}: ${distance} km`);

  // Find matching distance range
  const matchedRange = ranges.find(
    (range) => distance >= range.minDistance && distance <= range.maxDistance
  );

  if (!matchedRange) {
    return {
      serviceable: false,
      cost: 0,
      distance: distance,
      message: `Manual delivery not available: distance ${distance} km is outside configured ranges`,
    };
  }

  // Extract price and delivery time from matched range
  const shippingCost = Number(matchedRange.price) || 0;
  const estimatedDeliveryDays = matchedRange.deliveryTime
    ? parseInt(matchedRange.deliveryTime, 10)
    : 5; // Default 5 days

  return {
    serviceable: true,
    cost: shippingCost,
    distance: distance,
    estimatedDelivery: estimatedDeliveryDays,
    message: `Manual delivery available for distance ${distance} km`,
  };
};

/**
 * Track shipment by waybill number
 * @param {string} waybill - Waybill number
 * @returns {Promise<object>} Tracking information
 */
const trackShipment = async (waybill) => {
  if (!delhiveryConfig.isConfigured()) {
    throw new Error('Delhivery API key not configured');
  }

  try {
    const response = await axios.get(`${delhiveryConfig.config.baseUrl}${delhiveryConfig.endpoints.trackShipment}`, {
      params: {
        waybill: waybill,
      },
      headers: delhiveryConfig.getAuthHeaders(),
      timeout: 10000,
    });

    const trackingData = response.data;
    if (trackingData && trackingData.ShipmentData && trackingData.ShipmentData.length > 0) {
      const shipment = trackingData.ShipmentData[0];
      return {
        waybill,
        status: shipment.Status || 'Unknown',
        statusDescription: shipment.StatusDescription || '',
        location: shipment.Origin || '',
        destination: shipment.Destination || '',
        estimatedDelivery: shipment.ExpectedDeliveryDate || '',
        trackingHistory: shipment.Scan || [],
      };
    }

    return {
      waybill,
      status: 'Not Found',
      message: 'Tracking information not available',
    };
  } catch (error) {
    console.error('Error tracking shipment:', error.message);
    throw new Error('Failed to track shipment');
  }
};

/**
 * Track multiple shipments
 * @param {string[]} waybills - Array of waybill numbers
 * @returns {Promise<object[]>} Array of tracking information
 */
const trackMultipleShipments = async (waybills) => {
  if (!Array.isArray(waybills) || waybills.length === 0) {
    throw new Error('At least one waybill is required');
  }

  const trackingPromises = waybills.map((waybill) => 
    trackShipment(waybill).catch((error) => ({
      waybill,
      error: error.message,
    }))
  );

  return Promise.all(trackingPromises);
};

module.exports = {
  checkServiceability,
  calculateShipping,
  calculateShippingCost,
  trackShipment,
  trackMultipleShipments,
  validatePincode,
};

