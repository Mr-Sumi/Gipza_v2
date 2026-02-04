const Coupon = require('../../models/Coupon');
const NewOrder = require('../../models/NewOrder');
const couponService = require('../couponService');

/**
 * Reuse existing coupon service functions
 */
const createCoupon = async (couponData) => {
  return await couponService.createCoupon(couponData);
};

const getAllCoupons = async (filters = {}) => {
  return await couponService.getAllCoupons(filters);
};

const getCouponById = async (id) => {
  return await couponService.getCouponById(id);
};

const updateCoupon = async (id, updateData) => {
  return await couponService.updateCoupon(id, updateData);
};

const deleteCoupon = async (id) => {
  return await couponService.deleteCoupon(id);
};

/**
 * Activate coupon
 */
const activateCoupon = async (id) => {
  const coupon = await Coupon.findById(id);
  if (!coupon) {
    throw new Error('Coupon not found');
  }

  coupon.isActive = true;
  await coupon.save();

  return coupon;
};

/**
 * Deactivate coupon
 */
const deactivateCoupon = async (id) => {
  const coupon = await Coupon.findById(id);
  if (!coupon) {
    throw new Error('Coupon not found');
  }

  coupon.isActive = false;
  await coupon.save();

  return coupon;
};

/**
 * Get coupon usage statistics
 */
const getCouponUsageStats = async (id) => {
  const coupon = await Coupon.findById(id).lean();
  if (!coupon) {
    return null;
  }

  // Find all orders that used this coupon
  const orders = await NewOrder.find({
    coupon_code: coupon.code,
    is_deleted: false,
  }).lean();

  // Calculate statistics
  const usageCount = orders.length;
  const totalDiscountApplied = orders.reduce((sum, order) => {
    return sum + (order.coupon_discount || 0);
  }, 0);

  const totalRevenue = orders.reduce((sum, order) => {
    return sum + (order.final_order_amount || 0);
  }, 0);

  // Get orders with user details (limited to recent orders for performance)
  const recentOrders = orders
    .sort((a, b) => new Date(b.order_creation_time) - new Date(a.order_creation_time))
    .slice(0, 10)
    .map((order) => ({
      order_id: order.user_order_id || order._id,
      order_date: order.order_creation_time,
      discount_applied: order.coupon_discount || 0,
      order_amount: order.final_order_amount || 0,
    }));

  return {
    coupon: {
      id: coupon._id,
      code: coupon.code,
      isActive: coupon.isActive,
      expiryDate: coupon.expiryDate,
    },
    statistics: {
      usage_count: usageCount,
      total_discount_applied: totalDiscountApplied,
      total_revenue: totalRevenue,
      average_discount_per_order:
        usageCount > 0 ? totalDiscountApplied / usageCount : 0,
      average_order_value: usageCount > 0 ? totalRevenue / usageCount : 0,
    },
    recent_orders: recentOrders,
  };
};

module.exports = {
  createCoupon,
  getAllCoupons,
  getCouponById,
  updateCoupon,
  deleteCoupon,
  activateCoupon,
  deactivateCoupon,
  getCouponUsageStats,
};
