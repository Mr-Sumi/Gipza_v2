const express = require('express');
const router = express.Router();
const dashboardControllers = require('../../controllers/admin/dashboardControllers');
const { validate } = require('../../middleware/validator');
const {
  getDashboardStatsValidation,
  getRecentOrdersValidation,
  getSalesChartDataValidation,
  getTopSellingProductsValidation,
} = require('../../validations/dashboard.validation');

// Dashboard routes
router.get('/stats', validate(getDashboardStatsValidation), dashboardControllers.getDashboardStats);
router.get('/recent-orders', validate(getRecentOrdersValidation), dashboardControllers.getRecentOrders);
router.get('/sales-chart', validate(getSalesChartDataValidation), dashboardControllers.getSalesChartData);
router.get('/top-products', validate(getTopSellingProductsValidation), dashboardControllers.getTopSellingProducts);

module.exports = router;

