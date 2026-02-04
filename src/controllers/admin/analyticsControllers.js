const analyticsService = require('../../services/admin/analyticsService');

/**
 * Get sales report (Admin)
 * GET /api/v1/admin/analytics/sales-report
 */
exports.getSalesReport = async (req, res) => {
  try {
    const { startDate, endDate, groupBy } = req.query;

    const report = await analyticsService.getSalesReport({
      startDate,
      endDate,
      groupBy,
    });

    return res.status(200).json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error('Admin get sales report failed:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch sales report',
    });
  }
};

/**
 * Get revenue report (Admin)
 * GET /api/v1/admin/analytics/revenue-report
 */
exports.getRevenueReport = async (req, res) => {
  try {
    const { startDate, endDate, period } = req.query;

    const report = await analyticsService.getRevenueReport({
      startDate,
      endDate,
      period,
    });

    return res.status(200).json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error('Admin get revenue report failed:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch revenue report',
    });
  }
};

/**
 * Get customer analytics (Admin)
 * GET /api/v1/admin/analytics/customers
 */
exports.getCustomerAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const analytics = await analyticsService.getCustomerAnalytics({
      startDate,
      endDate,
    });

    return res.status(200).json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    console.error('Admin get customer analytics failed:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch customer analytics',
    });
  }
};

/**
 * Get product analytics (Admin)
 * GET /api/v1/admin/analytics/products
 */
exports.getProductAnalytics = async (req, res) => {
  try {
    const analytics = await analyticsService.getProductAnalytics();

    return res.status(200).json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    console.error('Admin get product analytics failed:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch product analytics',
    });
  }
};

/**
 * Get inventory report (Admin)
 * GET /api/v1/admin/analytics/inventory
 */
exports.getInventoryReport = async (req, res) => {
  try {
    const { lowStockThreshold } = req.query;

    const report = await analyticsService.getInventoryReport({
      lowStockThreshold: lowStockThreshold ? parseInt(lowStockThreshold) : 10,
    });

    return res.status(200).json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error('Admin get inventory report failed:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch inventory report',
    });
  }
};

/**
 * Get order analytics (Admin)
 * GET /api/v1/admin/analytics/orders
 */
exports.getOrderAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const analytics = await analyticsService.getOrderAnalytics({
      startDate,
      endDate,
    });

    return res.status(200).json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    console.error('Admin get order analytics failed:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch order analytics',
    });
  }
};
