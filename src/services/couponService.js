const Coupon = require('../models/Coupon');

/**
 * Apply coupon and calculate discount
 * @param {string} code - Coupon code
 * @param {number} orderAmount - Order amount
 * @returns {Promise<object>} Coupon details with discount
 */
const applyCoupon = async (code, orderAmount) => {
  const coupon = await Coupon.findOne({ code: code.toUpperCase() })
    .select('_id code isActive expiryDate minPurchase discountType discountValue')
    .lean();

  if (!coupon) {
    throw new Error('Invalid coupon code');
  }

  if (!coupon.isActive) {
    throw new Error('Coupon is not active');
  }

  if (new Date(coupon.expiryDate) < new Date()) {
    throw new Error('Coupon has expired');
  }

  if (orderAmount < coupon.minPurchase) {
    throw new Error(`Minimum purchase of ₹${coupon.minPurchase} required to use this coupon`);
  }

  let discountAmount = 0;
  if (coupon.discountType === 'percentage') {
    discountAmount = (orderAmount * coupon.discountValue) / 100;
  } else {
    discountAmount = Math.min(coupon.discountValue, orderAmount); 
  }

  const finalAmount = orderAmount - discountAmount;

  return {
    coupon: {
      id: coupon._id,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountAmount,
      finalAmount,
    },
  };
};

/**
 * Create coupon
 * @param {object} couponData - Coupon data
 * @returns {Promise<object>} Created coupon
 */
const createCoupon = async (couponData) => {
  const { code, discountType, discountValue, minPurchase, expiryDate, isActive } = couponData;


  const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() }).select('_id code').lean();
  if (existingCoupon) {
    throw new Error(`Coupon with code '${code}' already exists`);
  }

  if (discountType === 'percentage' && (discountValue <= 0 || discountValue > 100)) {
    throw new Error('Percentage discount must be between 1 and 100');
  }

  if (discountType === 'fixed' && discountValue <= 0) {
    throw new Error('Fixed discount must be greater than 0');
  }

  const coupon = new Coupon({
    code: code.toUpperCase(),
    discountType,
    discountValue,
    minPurchase: minPurchase || 0,
    expiryDate: new Date(expiryDate),
    isActive: isActive !== undefined ? isActive : true,
  });

  await coupon.save();
  return coupon;
};

/**
 * Get all coupons
 * @param {object} filters - Filter options
 * @returns {Promise<object>} Coupons list with pagination
 */
const getAllCoupons = async (filters = {}) => {
  const { page = 1, limit = 10, isActive } = filters;

  const query = {};
  if (isActive !== undefined) {
    query.isActive = isActive;
  }

  const skip = (page - 1) * limit;

  const [coupons, total] = await Promise.all([
    Coupon.find(query)
      .select('-__v')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Coupon.countDocuments(query),
  ]);

  return {
    coupons,
    pagination: {
      current_page: page,
      total_pages: Math.ceil(total / limit),
      total_coupons: total,
      limit,
    },
  };
};

/**
 * Get coupon by ID
 * @param {string} id - Coupon ID
 * @returns {Promise<object>} Coupon details
 */
const getCouponById = async (id) => {
  const coupon = await Coupon.findById(id);
  if (!coupon) {
    throw new Error('Coupon not found');
  }
  return coupon;
};

/**
 * Update coupon
 * @param {string} id - Coupon ID
 * @param {object} updateData - Update data
 * @returns {Promise<object>} Updated coupon
 */
const updateCoupon = async (id, updateData) => {
  const coupon = await Coupon.findById(id);
  if (!coupon) {
    throw new Error('Coupon not found');
  }

  // Check if code is being updated and if it already exists
  if (updateData.code) {
    const existingCoupon = await Coupon.findOne({
      code: updateData.code.toUpperCase(),
      _id: { $ne: id },
    }).select('_id code').lean();
    if (existingCoupon) {
      throw new Error(`Coupon with code '${updateData.code}' already exists`);
    }
    updateData.code = updateData.code.toUpperCase();
  }

  // Validate discount value if being updated
  if (updateData.discountType || updateData.discountValue) {
    const discountType = updateData.discountType || coupon.discountType;
    const discountValue = updateData.discountValue || coupon.discountValue;

    if (discountType === 'percentage' && (discountValue <= 0 || discountValue > 100)) {
      throw new Error('Percentage discount must be between 1 and 100');
    }

    if (discountType === 'fixed' && discountValue <= 0) {
      throw new Error('Fixed discount must be greater than 0');
    }
  }

  // Convert expiryDate string to Date if provided
  if (updateData.expiryDate) {
    updateData.expiryDate = new Date(updateData.expiryDate);
  }

  Object.assign(coupon, updateData);
  await coupon.save();

  return coupon;
};

/**
 * Delete coupon
 * @param {string} id - Coupon ID
 * @returns {Promise<object>} Deleted coupon
 */
const deleteCoupon = async (id) => {
  const coupon = await Coupon.findByIdAndDelete(id);
  if (!coupon) {
    throw new Error('Coupon not found');
  }
  return coupon;
};

module.exports = {
  applyCoupon,
  createCoupon,
  getAllCoupons,
  getCouponById,
  updateCoupon,
  deleteCoupon,
};

