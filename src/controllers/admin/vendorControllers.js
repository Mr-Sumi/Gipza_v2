const vendorService = require('../../services/admin/vendorService');

/**
 * List all vendors with enhanced filters (Admin)
 * GET /api/v1/admin/vendors
 */
exports.listVendors = async (req, res) => {
  try {
    const result = await vendorService.listVendors(req.query);

    return res.status(200).json({
      success: true,
      vendors: result.vendors,
      pagination: result.pagination,
      filters_applied: result.filters_applied,
    });
  } catch (error) {
    console.error('Admin list vendors failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch vendors',
      error: error.message,
    });
  }
};

/**
 * Get warehouse status for a vendor (Admin)
 * GET /api/v1/admin/vendors/:id/warehouse/status
 */
exports.getWarehouseStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const warehouseStatus = await vendorService.getWarehouseStatus(id);

    if (!warehouseStatus) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: warehouseStatus,
    });
  } catch (error) {
    console.error('Admin get warehouse status failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch warehouse status',
      error: error.message,
    });
  }
};

/**
 * Create vendor (Admin)
 * POST /api/v1/admin/vendors
 */
exports.createVendor = async (req, res) => {
  try {
    const vendorData = req.body;

    const vendor = await vendorService.createVendor(vendorData);

    return res.status(201).json({
      success: true,
      message: 'Vendor created successfully',
      data: vendor,
      warehouseRegistration: {
        attempted: true,
        status: vendor.warehouse?.status || 'pending',
      },
    });
  } catch (error) {
    console.error('Admin create vendor failed:', error);

    let statusCode = 500;
    if (error.message.includes('required') || error.message.includes('already exists')) {
      statusCode = 400;
    }

    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to create vendor',
    });
  }
};

/**
 * Update vendor (Admin)
 * PUT /api/v1/admin/vendors/:id
 */
exports.updateVendor = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const vendor = await vendorService.updateVendor(id, updateData);

    return res.status(200).json({
      success: true,
      message: 'Vendor updated successfully',
      data: vendor,
    });
  } catch (error) {
    console.error('Admin update vendor failed:', error);

    const statusCode = error.message === 'Vendor not found' ? 404 : 500;

    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to update vendor',
    });
  }
};

/**
 * Delete vendor (Admin)
 * DELETE /api/v1/admin/vendors/:id
 */
exports.deleteVendor = async (req, res) => {
  try {
    const { id } = req.params;

    await vendorService.deleteVendor(id);

    return res.status(200).json({
      success: true,
      message: 'Vendor deleted successfully',
    });
  } catch (error) {
    console.error('Admin delete vendor failed:', error);

    const statusCode = error.message === 'Vendor not found' ? 404 : 500;

    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to delete vendor',
    });
  }
};

/**
 * Retry warehouse registration (Admin)
 * POST /api/v1/admin/vendors/:id/warehouse/retry
 */
exports.retryWarehouseRegistration = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await vendorService.retryWarehouseRegistration(id);

    return res.status(200).json({
      success: result.success,
      message: result.message,
      data: {
        vendor_id: result.vendor_id,
        warehouse: result.warehouse,
      },
      error: result.error || null,
    });
  } catch (error) {
    console.error('Admin retry warehouse registration failed:', error);

    const statusCode = error.message === 'Vendor not found' ? 404 : 500;

    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to retry warehouse registration',
    });
  }
};

/**
 * Save vendor list (Admin)
 * POST /api/v1/admin/vendors/list-store
 */
exports.saveVendorList = async (req, res) => {
  try {
    const listData = req.body;
    const userId = req.user?.id || req.user?._id;

    const list = await vendorService.saveVendorList(listData, userId);

    return res.status(200).json({
      success: true,
      message: 'Vendor list saved successfully',
      data: list,
    });
  } catch (error) {
    console.error('Admin save vendor list failed:', error);

    let statusCode = 500;
    if (error.message.includes('required') || error.message.includes('must be one of')) {
      statusCode = 400;
    }

    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to save vendor list',
    });
  }
};
