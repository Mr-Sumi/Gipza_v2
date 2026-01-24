const vendorService = require('../services/vendorService');

/**
 * Get all vendors
 * GET /api/v1/vendors
 */
exports.getAllVendors = async (req, res) => {
  try {
    const { search, sort, status } = req.query;
    
    const vendors = await vendorService.getAllVendors({ search, sort, status });
    
    return res.status(200).json({
      success: true,
      count: vendors.length,
      data: vendors,
    });
  } catch (error) {
    console.error('Error in getAllVendors:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch vendors',
    });
  }
};

/**
 * Get single vendor by ID
 * GET /api/v1/vendors/:id
 */
exports.getVendorById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const vendor = await vendorService.getVendorById(id);
    
    return res.status(200).json({
      success: true,
      data: vendor,
    });
  } catch (error) {
    console.error('Error in getVendorById:', error);
    
    let statusCode = 500;
    if (error.message === 'Vendor not found') {
      statusCode = 404;
    }
    
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to fetch vendor',
    });
  }
};

/**
 * Get vendor lists
 * GET /api/v1/vendors/list
 */
exports.getVendorLists = async (req, res) => {
  try {
    const { type } = req.query;
    const userId = req.user?.id || null;
    
    const lists = await vendorService.getVendorLists({ type });
    
    return res.status(200).json({
      success: true,
      count: lists.length,
      data: lists,
    });
  } catch (error) {
    console.error('Error in getVendorLists:', error);
    
    let statusCode = 500;
    if (error.message.includes('Type must be one of')) {
      statusCode = 400;
    }
    
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to fetch lists',
    });
  }
};



