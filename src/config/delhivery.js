const dotenv = require('dotenv');
const axios = require('axios');

dotenv.config();

/**
 * Delhivery API Configuration
 * Centralized configuration for all Delhivery API integrations
 */
const delhiveryConfig = {
  apiKey: process.env.DELHIVERY_API_KEY,
  baseUrl: process.env.DELHIVERY_API_BASE_URL || 'https://track.delhivery.com',
  timeout: parseInt(process.env.DELHIVERY_API_TIMEOUT) || 30000, // 30 seconds default
  retryAttempts: parseInt(process.env.DELHIVERY_RETRY_ATTEMPTS) || 3,
  retryDelay: parseInt(process.env.DELHIVERY_RETRY_DELAY) || 2000, // 2 seconds
};

/**
 * Get authorization headers for Delhivery API
 * @returns {Object} Headers object with authorization
 */
const getAuthHeaders = () => {
  if (!delhiveryConfig.apiKey) {
    throw new Error('Delhivery API key not configured. Please set DELHIVERY_API_KEY in .env');
  }

  return {
    'Authorization': `Token ${delhiveryConfig.apiKey}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
};

/**
 * Get form data authorization headers (for shipment creation)
 * @returns {Object} Headers object with authorization
 */
const getFormAuthHeaders = () => {
  if (!delhiveryConfig.apiKey) {
    throw new Error('Delhivery API key not configured. Please set DELHIVERY_API_KEY in .env');
  }

  return {
    'Authorization': `Token ${delhiveryConfig.apiKey}`,
    'Content-Type': 'application/x-www-form-urlencoded',
    'Accept': 'application/json',
  };
};

/**
 * Create configured axios instance for Delhivery API
 * @returns {Object} Axios instance
 */
const createDelhiveryClient = () => {
  return axios.create({
    baseURL: delhiveryConfig.baseUrl,
    timeout: delhiveryConfig.timeout,
    headers: getAuthHeaders(),
  });
};

/**
 * Check if Delhivery API is configured
 * @returns {boolean} True if API key is configured
 */
const isConfigured = () => {
  return !!delhiveryConfig.apiKey;
};

/**
 * Get Delhivery API endpoints
 */
const endpoints = {
  // Warehouse Management
  createWarehouse: '/api/backend/clientwarehouse/create/',
  
  // Serviceability & Shipping
  checkServiceability: '/c/api/pin-codes/json/',
  calculateShipping: '/api/kinko/v1/invoice/charges/.json',
  
  // Shipment Management
  createShipment: '/api/cmu/create.json',
  trackShipment: '/api/v1/packages/json/',
};

module.exports = {
  config: delhiveryConfig,
  getAuthHeaders,
  getFormAuthHeaders,
  createDelhiveryClient,
  isConfigured,
  endpoints,
};

