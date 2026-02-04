const Vendor = require('../models/Vendor');
const ListStore = require('../models/ListStore');
const { registerVendorWarehouse } = require('./warehouseService');

/**
 * Get all vendors
 * @param {Object} options - Query options (search, sort, status)
 * @returns {Promise<Array>} Vendors array
 */
const getAllVendors = async (options = {}) => {
  const { search, sort = 'name', status } = options;
  
  let query = {};
  
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { city: { $regex: search, $options: 'i' } },
    ];
  }
  
  if (status) {
    query.status = status;
  }
  
  const sortOrder = sort.startsWith('-') 
    ? { [sort.substring(1)]: -1 } 
    : { [sort]: 1 };
  
  const vendors = await Vendor.find(query)
    .sort(sortOrder)
    .select('-__v')
    .populate('products.product', 'name sellingPrice')
    .lean();
  
  return vendors;
};

/**
 * Get single vendor by ID
 * @param {string} vendorId - Vendor ID
 * @returns {Promise<Object>} Vendor object
 */
const getVendorById = async (vendorId) => {
  const vendor = await Vendor.findById(vendorId)
    .select('-__v')
    .populate('products.product', 'name sellingPrice')
    .lean();
  
  if (!vendor) {
    throw new Error('Vendor not found');
  }
  
  return vendor;
};

/**
 * Create new vendor
 * @param {Object} vendorData - Vendor data
 * @returns {Promise<Object>} Created vendor
 */
const createVendor = async (vendorData) => {
  const {
    name,
    email,
    address,
    pincode,
    city,
    state,
    country = 'India',
    contactName,
    contactNumber,
    notes,
    delhiveryPickupLocationName,
    gstin,
    status = 'published',
    deliverablePincodes,
  } = vendorData;

  // Validate required fields
  if (!name || !address || !pincode || !city || !state || !contactNumber) {
    throw new Error('Name, address, pincode, city, state, and contact number are required');
  }

  const vendor = new Vendor({
    name: name.trim(),
    email: email?.trim() || null,
    address: address.trim(),
    pincode: pincode.trim(),
    city: city.trim(),
    state: state.trim(),
    country: country.trim(),
    contactName: contactName?.trim() || null,
    contactNumber: contactNumber.trim(),
    notes: notes?.trim() || null,
    delhiveryPickupLocationName: delhiveryPickupLocationName?.trim() || null,
    gstin: gstin?.trim() || null,
    status: status || 'draft',
    deliverablePincodes: deliverablePincodes || [],
  });

  const savedVendor = await vendor.save();

  // Attempt warehouse registration (async, non-blocking)
  try {
    console.log(`🏢 Attempting warehouse registration for new vendor: ${savedVendor.name}`);
    const warehouseResult = await registerVendorWarehouse(savedVendor);
    
    if (warehouseResult.success) {
      console.log(`✅ Warehouse registered successfully for ${savedVendor.name}: ${warehouseResult.warehouseName}`);
    } else {
      console.log(`⚠️ Warehouse registration failed for ${savedVendor.name}: ${warehouseResult.message}`);
    }
  } catch (warehouseError) {
    console.error(`❌ Warehouse registration error for ${savedVendor.name}:`, warehouseError.message);
    // Don't fail vendor creation if warehouse registration fails
  }

  return savedVendor;
};

/**
 * Update vendor
 * @param {string} vendorId - Vendor ID
 * @param {Object} updateData - Update data
 * @returns {Promise<Object>} Updated vendor
 */
const updateVendor = async (vendorId, updateData) => {
  const vendor = await Vendor.findById(vendorId);
  
  if (!vendor) {
    throw new Error('Vendor not found');
  }

  // Exclude products from direct update (managed separately)
  const { products, ...allowedUpdates } = updateData;

  // Update allowed fields
  Object.keys(allowedUpdates).forEach((key) => {
    if (allowedUpdates[key] !== undefined) {
      if (typeof allowedUpdates[key] === 'string') {
        vendor[key] = allowedUpdates[key].trim();
      } else {
        vendor[key] = allowedUpdates[key];
      }
    }
  });

  await vendor.save();
  
  return vendor;
};

/**
 * Delete vendor
 * @param {string} vendorId - Vendor ID
 * @returns {Promise<Object>} Deletion result
 */
const deleteVendor = async (vendorId) => {
  const vendor = await Vendor.findById(vendorId);
  
  if (!vendor) {
    throw new Error('Vendor not found');
  }

  // Check if any products are using this vendor
  const Product = require('../models/Product');
  const productsCount = await Product.countDocuments({ vendor: vendorId });
  
  if (productsCount > 0) {
    throw new Error(`Cannot delete vendor. ${productsCount} product(s) are using this vendor`);
  }

  await Vendor.findByIdAndDelete(vendorId);
  
  return {
    message: 'Vendor deleted successfully',
    deletedVendor: {
      id: vendor._id,
      name: vendor.name,
    },
  };
};

/**
 * Retry warehouse registration for a vendor
 * @param {string} vendorId - Vendor ID
 * @returns {Promise<Object>} Registration result
 */
const retryWarehouseRegistration = async (vendorId) => {
  const vendor = await Vendor.findById(vendorId);
  
  if (!vendor) {
    throw new Error('Vendor not found');
  }

  // Reset retry count and mark attempt in progress
  vendor.warehouse = vendor.warehouse || {};
  vendor.warehouse.retry_count = 0;
  vendor.warehouse.status = 'retrying';
  vendor.warehouse.last_attempt = new Date();
  vendor.warehouse.updated_at = new Date();
  await vendor.save();

  // Retry registration
  const result = await registerVendorWarehouse(vendor);

  if (result.success) {
    vendor.warehouse.status = 'registered';
    vendor.warehouse.name = result.warehouseName;
    vendor.warehouse.delhivery_warehouse_id = result.delhiveryId;
    vendor.warehouse.error_message = null;
    vendor.warehouse.updated_at = new Date();

    // Backward compatible flags
    vendor.vendor_delevery_name = result.warehouseName;
    vendor.delhiveryPickupLocationName = result.warehouseName;
    vendor.is_regsterd_dlevery = true;
    await vendor.save();

    return {
      success: true,
      message: 'Warehouse registered successfully',
      vendor_id: vendor._id,
      warehouse: vendor.warehouse,
    };
  } else {
    vendor.warehouse.status = 'failed';
    vendor.warehouse.error_message = result.error || 'Unknown error';
    vendor.warehouse.updated_at = new Date();
    await vendor.save();

    return {
      success: false,
      message: 'Warehouse registration failed',
      vendor_id: vendor._id,
      warehouse: vendor.warehouse,
      error: result.error,
    };
  }
};

/**
 * Get vendor lists
 * @param {Object} options - Query options (type)
 * @returns {Promise<Array>} Lists array
 */
const getVendorLists = async (options = {}) => {
  const { type } = options;
  
  let query = {};
  if (type) {
    const allowedTypes = ['vendor', 'pincode', 'category', 'tag', 'productTag', 'size', 'color', 'occasion', 'theme_banner', 'theme_tabs', 'theme_sections', 'theme_pincode'];
    if (!allowedTypes.includes(type)) {
      throw new Error(`Type must be one of: ${allowedTypes.join(', ')}`);
    }
    query.type = type;
  }
  console.log(query);
  const lists = await ListStore.find(query)
    .sort({ updatedAt: -1 })
    .limit(100)
    .select('-__v')
    .lean();
  
  return lists;
};

/**
 * Save vendor list
 * @param {Object} listData - List data (name, description, type, content)
 * @param {string} userId - User ID (optional)
 * @returns {Promise<Object>} Saved list
 */
const saveVendorList = async (listData, userId = null) => {
  const { name, description, type, content } = listData;

  if (!name || !type || !content) {
    throw new Error('Name, type, and content are required fields');
  }

  const allowedTypes = ['vendor', 'pincode', 'category', 'tag', 'productTag', 'size', 'color', 'occasion', 'theme_banner', 'theme_tabs', 'theme_sections', 'theme_pincode'];
  if (!allowedTypes.includes(type)) {
    throw new Error(`Type must be one of: ${allowedTypes.join(', ')}`);
  }

  const list = await ListStore.findOneAndUpdate(
    { name, type },
    {
      name: name.trim(),
      description: description?.trim() || '',
      type,
      content,
      createdBy: userId,
    },
    { new: true, upsert: true }
  );

  return list;
};

module.exports = {
  getAllVendors,
  getVendorById,
  createVendor,
  updateVendor,
  deleteVendor,
  retryWarehouseRegistration,
  getVendorLists,
  saveVendorList,
};

