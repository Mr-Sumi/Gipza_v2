const { z } = require('zod');
const mongoose = require('mongoose');

/**
 * MongoDB ObjectId validation
 */
const objectId = z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
  message: 'Invalid ObjectId format',
});

/**
 * Reuse existing validations from order.validation.js
 */
const {
  createCouponValidation,
  updateCouponValidation,
  getCouponValidation,
  deleteCouponValidation,
  getAllCouponsValidation,
} = require('../order.validation');

/**
 * Activate coupon validation
 */
const activateCouponValidation = z.object({
  params: z.object({
    id: objectId,
  }),
});

/**
 * Deactivate coupon validation
 */
const deactivateCouponValidation = z.object({
  params: z.object({
    id: objectId,
  }),
});

/**
 * Get coupon usage validation
 */
const getCouponUsageValidation = z.object({
  params: z.object({
    id: objectId,
  }),
});

module.exports = {
  createCouponValidation,
  getAllCouponsValidation,
  getCouponValidation,
  updateCouponValidation,
  deleteCouponValidation,
  activateCouponValidation,
  deactivateCouponValidation,
  getCouponUsageValidation,
};
