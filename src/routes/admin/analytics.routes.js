const express = require('express');
const router = express.Router();
const analyticsControllers = require('../../controllers/admin/analyticsControllers');
const { validate } = require('../../middleware/validator');
const {
  getSalesReportValidation,
  getRevenueReportValidation,
  getCustomerAnalyticsValidation,
  getProductAnalyticsValidation,
  getInventoryReportValidation,
  getOrderAnalyticsValidation,
} = require('../../validations/admin/analytics.validation');

/**
 * @route   GET /api/v1/admin/analytics/sales-report
 * @desc    Get sales report
 * @access  Admin/Manager
 */
router.get('/sales-report', validate(getSalesReportValidation), analyticsControllers.getSalesReport);

/**
 * @route   GET /api/v1/admin/analytics/revenue-report
 * @desc    Get revenue report
 * @access  Admin/Manager
 */
router.get('/revenue-report', validate(getRevenueReportValidation), analyticsControllers.getRevenueReport);

/**
 * @route   GET /api/v1/admin/analytics/customers
 * @desc    Get customer analytics
 * @access  Admin/Manager
 */
router.get('/customers', validate(getCustomerAnalyticsValidation), analyticsControllers.getCustomerAnalytics);

/**
 * @route   GET /api/v1/admin/analytics/products
 * @desc    Get product analytics
 * @access  Admin/Manager
 */
router.get('/products', validate(getProductAnalyticsValidation), analyticsControllers.getProductAnalytics);

/**
 * @route   GET /api/v1/admin/analytics/inventory
 * @desc    Get inventory report
 * @access  Admin/Manager
 */
router.get('/inventory', validate(getInventoryReportValidation), analyticsControllers.getInventoryReport);

/**
 * @route   GET /api/v1/admin/analytics/orders
 * @desc    Get order analytics
 * @access  Admin/Manager
 */
router.get('/orders', validate(getOrderAnalyticsValidation), analyticsControllers.getOrderAnalytics);

module.exports = router;
