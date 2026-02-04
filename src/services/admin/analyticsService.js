const NewOrder = require('../../models/NewOrder');
const Product = require('../../models/Product');
const User = require('../../models/User');
const Vendor = require('../../models/Vendor');
const Category = require('../../models/Category');

/**
 * Get sales report
 * @param {Object} filters - { startDate, endDate, groupBy }
 */
const getSalesReport = async (filters = {}) => {
  const { startDate, endDate, groupBy = 'date' } = filters;

  const matchQuery = {
    is_deleted: false,
  };

  if (startDate || endDate) {
    matchQuery.order_creation_time = {};
    if (startDate) {
      matchQuery.order_creation_time.$gte = new Date(startDate);
    }
    if (endDate) {
      matchQuery.order_creation_time.$lte = new Date(endDate);
    }
  }

  let groupStage = {};
  switch (groupBy) {
    case 'product':
      groupStage = {
        _id: '$vendor_orders.products.id',
        product_name: { $first: '$vendor_orders.products.name' },
        total_quantity: { $sum: '$vendor_orders.products.quantity' },
        total_revenue: { $sum: '$vendor_orders.products.item_cost' },
        order_count: { $sum: 1 },
      };
      break;
    case 'category':
      // This would require joining with Product model - simplified for now
      groupStage = {
        _id: '$order_date',
        total_revenue: { $sum: '$final_order_amount' },
        order_count: { $sum: 1 },
      };
      break;
    case 'date':
    default:
      groupStage = {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$order_creation_time' },
        },
        total_revenue: { $sum: '$final_order_amount' },
        order_count: { $sum: 1 },
        total_discount: { $sum: { $ifNull: ['$coupon_discount', 0] } },
      };
      break;
  }

  const pipeline = [
    { $match: matchQuery },
    { $unwind: '$vendor_orders' },
    { $unwind: '$vendor_orders.products' },
    { $group: groupStage },
    { $sort: { _id: 1 } },
  ];

  const salesData = await NewOrder.aggregate(pipeline);

  // Calculate totals
  const totals = salesData.reduce(
    (acc, item) => ({
      total_revenue: acc.total_revenue + (item.total_revenue || 0),
      total_orders: acc.total_orders + (item.order_count || 0),
      total_discount: acc.total_discount + (item.total_discount || 0),
    }),
    { total_revenue: 0, total_orders: 0, total_discount: 0 }
  );

  return {
    data: salesData,
    totals,
    period: {
      startDate: startDate || null,
      endDate: endDate || null,
      groupBy,
    },
  };
};

/**
 * Get revenue report
 * @param {Object} filters - { startDate, endDate, period }
 */
const getRevenueReport = async (filters = {}) => {
  const { startDate, endDate, period = 'daily' } = filters;

  const matchQuery = {
    is_deleted: false,
    order_status: { $nin: ['cancelled', 'refunded'] },
  };

  if (startDate || endDate) {
    matchQuery.order_creation_time = {};
    if (startDate) {
      matchQuery.order_creation_time.$gte = new Date(startDate);
    }
    if (endDate) {
      matchQuery.order_creation_time.$lte = new Date(endDate);
    }
  }

  let dateFormat = '%Y-%m-%d';
  if (period === 'weekly') {
    dateFormat = '%Y-W%V';
  } else if (period === 'monthly') {
    dateFormat = '%Y-%m';
  }

  const pipeline = [
    { $match: matchQuery },
    {
      $group: {
        _id: {
          $dateToString: { format: dateFormat, date: '$order_creation_time' },
        },
        revenue: { $sum: '$final_order_amount' },
        cod_revenue: {
          $sum: {
            $cond: [{ $eq: ['$payment_method', 'cod'] }, '$final_order_amount', 0],
          },
        },
        prepaid_revenue: {
          $sum: {
            $cond: [{ $ne: ['$payment_method', 'cod'] }, '$final_order_amount', 0],
          },
        },
        order_count: { $sum: 1 },
        cod_orders: {
          $sum: { $cond: [{ $eq: ['$payment_method', 'cod'] }, 1, 0] },
        },
        prepaid_orders: {
          $sum: { $cond: [{ $ne: ['$payment_method', 'cod'] }, 1, 0] },
        },
      },
    },
    { $sort: { _id: 1 } },
  ];

  const revenueData = await NewOrder.aggregate(pipeline);

  const totals = revenueData.reduce(
    (acc, item) => ({
      total_revenue: acc.total_revenue + item.revenue,
      total_orders: acc.total_orders + item.order_count,
      cod_revenue: acc.cod_revenue + item.cod_revenue,
      prepaid_revenue: acc.prepaid_revenue + item.prepaid_revenue,
    }),
    { total_revenue: 0, total_orders: 0, cod_revenue: 0, prepaid_revenue: 0 }
  );

  return {
    data: revenueData,
    totals,
    period: {
      startDate: startDate || null,
      endDate: endDate || null,
      period,
    },
  };
};

/**
 * Get customer analytics
 */
const getCustomerAnalytics = async (filters = {}) => {
  const { startDate, endDate } = filters;

  const matchQuery = {};
  if (startDate || endDate) {
    matchQuery.createdAt = {};
    if (startDate) {
      matchQuery.createdAt.$gte = new Date(startDate);
    }
    if (endDate) {
      matchQuery.createdAt.$lte = new Date(endDate);
    }
  }

  // New customers count
  const newCustomersCount = await User.countDocuments({
    ...matchQuery,
    role: 'customer',
  });

  // Top customers by spending
  const topCustomers = await NewOrder.aggregate([
    {
      $match: {
        is_deleted: false,
        order_status: { $nin: ['cancelled', 'refunded'] },
      },
    },
    {
      $group: {
        _id: '$user',
        total_spent: { $sum: '$final_order_amount' },
        order_count: { $sum: 1 },
      },
    },
    { $sort: { total_spent: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user',
      },
    },
    { $unwind: '$user' },
    {
      $project: {
        user_id: '$_id',
        user_name: '$user.name',
        user_phone: '$user.phoneNumber',
        total_spent: 1,
        order_count: 1,
      },
    },
  ]);

  // Customer lifetime value (average)
  const avgLifetimeValue = await NewOrder.aggregate([
    {
      $match: {
        is_deleted: false,
        order_status: { $nin: ['cancelled', 'refunded'] },
      },
    },
    {
      $group: {
        _id: '$user',
        total_spent: { $sum: '$final_order_amount' },
      },
    },
    {
      $group: {
        _id: null,
        avg_lifetime_value: { $avg: '$total_spent' },
      },
    },
  ]);

  return {
    new_customers: newCustomersCount,
    top_customers: topCustomers,
    average_lifetime_value:
      avgLifetimeValue[0]?.avg_lifetime_value || 0,
  };
};

/**
 * Get product analytics
 */
const getProductAnalytics = async () => {
  // Top selling products
  const topSellingProducts = await NewOrder.aggregate([
    {
      $match: {
        is_deleted: false,
        order_status: { $nin: ['cancelled', 'refunded'] },
      },
    },
    { $unwind: '$vendor_orders' },
    { $unwind: '$vendor_orders.products' },
    {
      $group: {
        _id: '$vendor_orders.products.id',
        product_name: { $first: '$vendor_orders.products.name' },
        total_quantity: { $sum: '$vendor_orders.products.quantity' },
        total_revenue: { $sum: '$vendor_orders.products.item_cost' },
        order_count: { $sum: 1 },
      },
    },
    { $sort: { total_quantity: -1 } },
    { $limit: 10 },
  ]);

  // Low stock products (stock < 10)
  const lowStockProducts = await Product.find({
    stock: { $lt: 10, $gt: 0 },
    is_deleted: false,
  })
    .select('name sku stock sellingPrice')
    .limit(50)
    .lean();

  // Out of stock products
  const outOfStockProducts = await Product.find({
    stock: { $lte: 0 },
    is_deleted: false,
  })
    .select('name sku stock sellingPrice')
    .limit(50)
    .lean();

  // Product performance metrics
  const totalProducts = await Product.countDocuments({ is_deleted: false });
  const publishedProducts = await Product.countDocuments({
    is_deleted: false,
    status: 'published',
  });
  const activeProducts = await Product.countDocuments({
    is_deleted: false,
    isActive: true,
  });

  return {
    top_selling_products: topSellingProducts,
    low_stock_products: lowStockProducts,
    out_of_stock_products: outOfStockProducts,
    metrics: {
      total_products: totalProducts,
      published_products: publishedProducts,
      active_products: activeProducts,
      low_stock_count: lowStockProducts.length,
      out_of_stock_count: outOfStockProducts.length,
    },
  };
};

/**
 * Get inventory report
 */
const getInventoryReport = async (filters = {}) => {
  const { lowStockThreshold = 10 } = filters;

  // Stock levels by product
  const stockLevels = await Product.find({
    is_deleted: false,
  })
    .select('name sku stock sellingPrice category vendor')
    .populate('category', 'name')
    .populate('vendor', 'name')
    .sort({ stock: 1 })
    .lean();

  // Low stock alerts
  const lowStockAlerts = stockLevels.filter((p) => p.stock < lowStockThreshold && p.stock > 0);

  // Stock movement would require a separate StockMovement model
  // For now, we'll return current stock levels

  const stockSummary = stockLevels.reduce(
    (acc, product) => {
      if (product.stock <= 0) {
        acc.out_of_stock++;
      } else if (product.stock < lowStockThreshold) {
        acc.low_stock++;
      } else {
        acc.in_stock++;
      }
      acc.total_value += product.stock * (product.sellingPrice || 0);
      return acc;
    },
    { in_stock: 0, low_stock: 0, out_of_stock: 0, total_value: 0 }
  );

  return {
    stock_levels: stockLevels,
    low_stock_alerts: lowStockAlerts,
    summary: stockSummary,
  };
};

/**
 * Get order analytics
 */
const getOrderAnalytics = async (filters = {}) => {
  const { startDate, endDate } = filters;

  const matchQuery = {
    is_deleted: false,
  };

  if (startDate || endDate) {
    matchQuery.order_creation_time = {};
    if (startDate) {
      matchQuery.order_creation_time.$gte = new Date(startDate);
    }
    if (endDate) {
      matchQuery.order_creation_time.$lte = new Date(endDate);
    }
  }

  // Order status breakdown
  const statusBreakdown = await NewOrder.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: '$order_status',
        count: { $sum: 1 },
        total_revenue: { $sum: '$final_order_amount' },
      },
    },
    { $sort: { count: -1 } },
  ]);

  // Order trends over time
  const orderTrends = await NewOrder.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$order_creation_time' },
        },
        order_count: { $sum: 1 },
        total_revenue: { $sum: '$final_order_amount' },
      },
    },
    { $sort: { _id: 1 } },
    { $limit: 30 }, // Last 30 days
  ]);

  // Average order value trends
  const avgOrderValue = await NewOrder.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$order_creation_time' },
        },
        avg_order_value: { $avg: '$final_order_amount' },
        order_count: { $sum: 1 },
      },
    },
    { $sort: { _id: -1 } },
    { $limit: 30 },
  ]);

  // Overall metrics
  const totalOrders = await NewOrder.countDocuments(matchQuery);
  const totalRevenue = await NewOrder.aggregate([
    { $match: { ...matchQuery, order_status: { $nin: ['cancelled', 'refunded'] } } },
    { $group: { _id: null, total: { $sum: '$final_order_amount' } } },
  ]);

  const avgOrderValueOverall = await NewOrder.aggregate([
    { $match: { ...matchQuery, order_status: { $nin: ['cancelled', 'refunded'] } } },
    { $group: { _id: null, avg: { $avg: '$final_order_amount' } } },
  ]);

  return {
    status_breakdown: statusBreakdown,
    order_trends: orderTrends,
    average_order_value_trends: avgOrderValue,
    metrics: {
      total_orders: totalOrders,
      total_revenue: totalRevenue[0]?.total || 0,
      average_order_value: avgOrderValueOverall[0]?.avg || 0,
    },
  };
};

module.exports = {
  getSalesReport,
  getRevenueReport,
  getCustomerAnalytics,
  getProductAnalytics,
  getInventoryReport,
  getOrderAnalytics,
};
