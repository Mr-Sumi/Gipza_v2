const axios = require('axios');
const Vendor = require('../models/Vendor');
const delhiveryConfig = require('../config/delhivery');

/**
 * Register a warehouse with Delhivery for a vendor
 * @param {Object} vendor - Vendor object
 * @returns {Promise<Object>} Registration result
 */
const registerWarehouseWithDelhivery = async (vendor) => {
  try {
    if (!delhiveryConfig.isConfigured()) {
      console.warn('Delhivery API key not configured. Skipping warehouse registration.');
      return {
        success: false,
        error: 'Delhivery API key not configured',
        warehouseName: `${vendor.name}_gipza`
      };
    }

    const warehouseName = `${vendor.name}_gipza`;
    
    const warehouseData = {
      phone: String((vendor.contactNumber || '').replace(/\D/g, '')),
      city: String(vendor.city || '').trim(),
      name: String(warehouseName),
      pin: String((vendor.pincode || '').toString().replace(/\D/g, '')),
      address: String(vendor.address || '').trim(),
      country: String(vendor.country || 'India').trim(),
      email: vendor.email || undefined,
      registered_name: String(vendor.name || warehouseName).trim(),
      return_address: String(vendor.address || '').trim(),
      return_pin: String((vendor.pincode || '').toString().replace(/\D/g, '')),
      return_city: String(vendor.city || '').trim(),
      return_state: String(vendor.state || '').trim(),
      return_country: String(vendor.country || 'India').trim()
    };

    console.log(`🏢 Registering warehouse for vendor: ${vendor.name} (${warehouseName})`);

    const data = JSON.stringify(warehouseData);
    const response = await axios.request({
      method: 'post',
      maxBodyLength: Infinity,
      url: `${delhiveryConfig.config.baseUrl}${delhiveryConfig.endpoints.createWarehouse}`,
      headers: delhiveryConfig.getAuthHeaders(),
      data,
      timeout: delhiveryConfig.config.timeout
    });

    if (response.status === 200 || response.status === 201) {
      console.log(`✅ Warehouse registered successfully: ${warehouseName}`);
      return {
        success: true,
        warehouseName,
        delhiveryId: response.data?.warehouse_id || response.data?.id || warehouseName,
        message: 'Warehouse registered successfully'
      };
    } else {
      throw new Error(response.data?.message || 'Warehouse registration failed');
    }

  } catch (error) {
    console.error(`❌ Warehouse registration failed for ${vendor.name}:`, error.message);
    console.error('Error details:', error.response?.data || error.response?.statusText || 'No additional details');
    return {
      success: false,
      error: error.response?.data?.message || error.message,
      warehouseName: `${vendor.name}_gipza`
    };
  }
};

/**
 * Register warehouse for a single vendor
 * @param {String|Object} vendorId - Vendor ID or vendor object
 * @returns {Promise<Object>} Registration result
 */
const registerVendorWarehouse = async (vendorId) => {
  try {
    let vendor;
    
    if (typeof vendorId === 'string') {
      vendor = await Vendor.findById(vendorId);
      if (!vendor) {
        throw new Error(`Vendor not found: ${vendorId}`);
      }
    } else {
      vendor = vendorId;
    }

    // Check if warehouse is already registered
    if (vendor.warehouse?.status === 'registered') {
      return {
        success: true,
        message: 'Warehouse already registered',
        warehouseName: vendor.warehouse.name,
        vendorName: vendor.name
      };
    }

    // Check if max retries exceeded
    if (vendor.warehouse?.retry_count >= (vendor.warehouse?.max_retries || 3)) {
      return {
        success: false,
        message: 'Max retries exceeded',
        vendorName: vendor.name,
        retryCount: vendor.warehouse.retry_count
      };
    }

    // Update vendor status to retrying
    vendor.warehouse = vendor.warehouse || {};
    vendor.warehouse.status = 'retrying';
    vendor.warehouse.last_attempt = new Date();
    vendor.warehouse.retry_count = (vendor.warehouse.retry_count || 0) + 1;
    await vendor.save();

    // Attempt warehouse registration
    const result = await registerWarehouseWithDelhivery(vendor);

    if (result.success) {
      // Update vendor with success
      vendor.warehouse.status = 'registered';
      vendor.warehouse.name = result.warehouseName;
      vendor.warehouse.delhivery_warehouse_id = result.delhiveryId;
      vendor.warehouse.error_message = null;
      vendor.warehouse.updated_at = new Date();
      
      // Update legacy fields for backward compatibility
      vendor.vendor_delevery_name = result.warehouseName;
      vendor.delhiveryPickupLocationName = result.warehouseName;
      vendor.is_regsterd_dlevery = true;
      
      await vendor.save();

      return {
        success: true,
        message: 'Warehouse registered successfully',
        warehouseName: result.warehouseName,
        vendorName: vendor.name,
        delhiveryId: result.delhiveryId
      };
    } else {
      // Update vendor with failure
      vendor.warehouse.status = 'failed';
      vendor.warehouse.error_message = result.error;
      vendor.warehouse.updated_at = new Date();
      await vendor.save();

      return {
        success: false,
        message: 'Warehouse registration failed',
        error: result.error,
        vendorName: vendor.name,
        retryCount: vendor.warehouse.retry_count
      };
    }

  } catch (error) {
    console.error(`❌ Error registering warehouse for vendor:`, error);
    return {
      success: false,
      message: 'Warehouse registration error',
      error: error.message
    };
  }
};

module.exports = {
  registerVendorWarehouse,
  registerWarehouseWithDelhivery
};

