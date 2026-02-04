const Vendor = require('../../models/Vendor');
const vendorService = require('../vendorService');

/**
 * Enhanced list vendors for admin with pagination and warehouse filters
 */
const listVendors = async (filters = {}) => {
  const {
    page = 1,
    limit = 20,
    status,
    search,
    warehouse_status,
    sort = 'name',
  } = filters;

  let query = {};

  // Status filter
  if (status) {
    query.status = status;
  }

  // Warehouse status filter
  if (warehouse_status) {
    query['warehouse.status'] = warehouse_status;
  }

  // Search filter
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { city: { $regex: search, $options: 'i' } },
      { contactNumber: { $regex: search, $options: 'i' } },
    ];
  }

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  const sortOrder = sort.startsWith('-')
    ? { [sort.substring(1)]: -1 }
    : { [sort]: 1 };

  // Fetch vendors with warehouse info
  const vendorsRaw = await Vendor.find(query)
    .select('-__v')
    .sort(sortOrder)
    .skip(skip)
    .limit(limitNum)
    .lean();

  const totalVendors = await Vendor.countDocuments(query);

  // Enrich vendors with warehouse status summary
  const vendors = vendorsRaw.map((vendor) => {
    const vendorObj = { ...vendor };

    // Add warehouse status summary
    vendorObj.warehouse_status = vendorObj.warehouse?.status || 'pending';
    vendorObj.warehouse_registered = vendorObj.warehouse?.status === 'registered';
    vendorObj.warehouse_retry_count = vendorObj.warehouse?.retry_count || 0;
    vendorObj.warehouse_error = vendorObj.warehouse?.error_message || null;

    return vendorObj;
  });

  return {
    vendors,
    pagination: {
      current_page: pageNum,
      total_pages: Math.ceil(totalVendors / limitNum),
      total_vendors: totalVendors,
      limit: limitNum,
      has_next_page: pageNum < Math.ceil(totalVendors / limitNum),
      has_prev_page: pageNum > 1,
    },
    filters_applied: {
      status,
      search,
      warehouse_status,
    },
  };
};

/**
 * Get detailed warehouse status for a vendor
 */
const getWarehouseStatus = async (vendorId) => {
  const vendor = await Vendor.findById(vendorId).select('name warehouse').lean();

  if (!vendor) {
    return null;
  }

  const warehouse = vendor.warehouse || {};

  return {
    vendor_id: vendor._id,
    vendor_name: vendor.name,
    warehouse: {
      name: warehouse.name || null,
      status: warehouse.status || 'pending',
      retry_count: warehouse.retry_count || 0,
      max_retries: warehouse.max_retries || 3,
      last_attempt: warehouse.last_attempt || null,
      error_message: warehouse.error_message || null,
      delhivery_warehouse_id: warehouse.delhivery_warehouse_id || null,
      created_at: warehouse.created_at || null,
      updated_at: warehouse.updated_at || null,
    },
    is_registered: warehouse.status === 'registered',
    can_retry: warehouse.status === 'failed' && (warehouse.retry_count || 0) < (warehouse.max_retries || 3),
    retries_remaining: Math.max(0, (warehouse.max_retries || 3) - (warehouse.retry_count || 0)),
  };
};

/**
 * Reuse existing vendor service functions
 */
const createVendor = async (vendorData) => {
  return await vendorService.createVendor(vendorData);
};

const updateVendor = async (vendorId, updateData) => {
  return await vendorService.updateVendor(vendorId, updateData);
};

const deleteVendor = async (vendorId) => {
  return await vendorService.deleteVendor(vendorId);
};

const retryWarehouseRegistration = async (vendorId) => {
  return await vendorService.retryWarehouseRegistration(vendorId);
};

const saveVendorList = async (listData, userId) => {
  return await vendorService.saveVendorList(listData, userId);
};

module.exports = {
  listVendors,
  getWarehouseStatus,
  createVendor,
  updateVendor,
  deleteVendor,
  retryWarehouseRegistration,
  saveVendorList,
};
