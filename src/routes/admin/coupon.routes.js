const express = require('express');
const router = express.Router();
const couponControllers = require('../../controllers/admin/couponControllers');
const { validate } = require('../../middleware/validator');
const {
  createCouponValidation,
  getAllCouponsValidation,
  getCouponValidation,
  updateCouponValidation,
  deleteCouponValidation,
  activateCouponValidation,
  deactivateCouponValidation,
  getCouponUsageValidation,
} = require('../../validations/admin/coupon.validation');

/**
 * @route   GET /api/v1/admin/coupons
 * @desc    Get all coupons
 * @access  Admin/Manager
 */
router.get('/', validate(getAllCouponsValidation), couponControllers.getAllCoupons);

/**
 * @route   GET /api/v1/admin/coupons/:id/usage
 * @desc    Get coupon usage statistics
 * @access  Admin/Manager
 * @note    Must be defined before /:id to avoid route conflicts
 */
router.get('/:id/usage', validate(getCouponUsageValidation), couponControllers.getCouponUsage);

/**
 * @route   GET /api/v1/admin/coupons/:id
 * @desc    Get coupon by ID
 * @access  Admin/Manager
 */
router.get('/:id', validate(getCouponValidation), couponControllers.getCouponById);

/**
 * @route   POST /api/v1/admin/coupons
 * @desc    Create coupon
 * @access  Admin/Manager
 */
router.post('/', validate(createCouponValidation), couponControllers.createCoupon);

/**
 * @route   PUT /api/v1/admin/coupons/:id/activate
 * @desc    Activate coupon
 * @access  Admin/Manager
 * @note    Must be defined before /:id to avoid route conflicts
 */
router.put('/:id/activate', validate(activateCouponValidation), couponControllers.activateCoupon);

/**
 * @route   PUT /api/v1/admin/coupons/:id/deactivate
 * @desc    Deactivate coupon
 * @access  Admin/Manager
 * @note    Must be defined before /:id to avoid route conflicts
 */
router.put('/:id/deactivate', validate(deactivateCouponValidation), couponControllers.deactivateCoupon);

/**
 * @route   PUT /api/v1/admin/coupons/:id
 * @desc    Update coupon
 * @access  Admin/Manager
 */
router.put('/:id', validate(updateCouponValidation), couponControllers.updateCoupon);

/**
 * @route   DELETE /api/v1/admin/coupons/:id
 * @desc    Delete coupon
 * @access  Admin/Manager
 */
router.delete('/:id', validate(deleteCouponValidation), couponControllers.deleteCoupon);

module.exports = router;
