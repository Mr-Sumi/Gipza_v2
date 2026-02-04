const dashboardService = require('../../services/admin/dashboardService');

/**
 * Get dashboard statistics
 * GET /api/v1/admin/dashboard/stats
 */
exports.getDashboardStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const stats = await dashboardService.getDashboardStats({
      startDate,
      endDate,
    });

    return res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error in getDashboardStats:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch dashboard statistics',
    });
  }
};

/**
 * Get recent orders
 * GET /api/v1/admin/dashboard/recent-orders
 */
exports.getRecentOrders = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const orders = await dashboardService.getRecentOrders(limit);

    return res.status(200).json({
      success: true,
      data: orders,
      count: orders.length,
    });
  } catch (error) {
    console.error('Error in getRecentOrders:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch recent orders',
    });
  }
};

/**
 * Get sales chart data
 * GET /api/v1/admin/dashboard/sales-chart
 */
exports.getSalesChartData = async (req, res) => {
  try {
    const period = req.query.period || 'daily'; // daily, weekly, monthly
    const days = parseInt(req.query.days) || 30;
    
    if (!['daily', 'weekly', 'monthly'].includes(period)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid period. Must be daily, weekly, or monthly',
      });
    }

    const chartData = await dashboardService.getSalesChartData(period, days);

    return res.status(200).json({
      success: true,
      data: chartData,
      period,
      days,
    });
  } catch (error) {
    console.error('Error in getSalesChartData:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch sales chart data',
    });
  }
};

/**
 * Get top selling products
 * GET /api/v1/admin/dashboard/top-products
 */
exports.getTopSellingProducts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const { startDate, endDate } = req.query;
    
    if (limit < 1 || limit > 100) {
      return res.status(400).json({
        success: false,
        message: 'Limit must be between 1 and 100',
      });
    }

    const topProducts = await dashboardService.getTopSellingProducts(limit, {
      startDate,
      endDate,
    });

    return res.status(200).json({
      success: true,
      data: topProducts,
      count: topProducts.length,
    });
  } catch (error) {
    console.error('Error in getTopSellingProducts:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch top selling products',
    });
  }
};

