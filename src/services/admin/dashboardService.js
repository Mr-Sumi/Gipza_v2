const mongoose = require('mongoose');
const NewOrder = require('../../models/NewOrder');
const User = require('../../models/User');
const Product = require('../../models/Product');
const Vendor = require('../../models/Vendor');
const Category = require('../../models/Category');

/**
 * Get dashboard statistics
 * @param {Object} options - Filter options (dateRange, etc.)
 * @returns {Promise<Object>} Dashboard stats
 */
const getDashboardStats = async (options = {}) => {
  try {
    const { startDate, endDate } = options;
    

    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.order_creation_time = {};
      if (startDate) dateFilter.order_creation_time.$gte = new Date(startDate);
      if (endDate) dateFilter.order_creation_time.$lte = new Date(endDate);
    }

    const baseFilter = { is_deleted: false, ...dateFilter };

    const orders = await NewOrder.find(baseFilter).lean();

    const totalOrders = orders.length;
    const pendingOrders = orders.filter(o => o.status === 'payment_pending' || o.status === 'pending').length;
    const confirmedOrders = orders.filter(o => o.status === 'confirmed').length;
    const processingOrders = orders.filter(o => o.status === 'processing').length;
    const shippedOrders = orders.filter(o => o.status === 'shipped' || o.status === 'ready_to_ship').length;
    const deliveredOrders = orders.filter(o => o.status === 'delivered').length;
    const cancelledOrders = orders.filter(o => o.status === 'cancelled').length;

    const totalRevenue = orders
      .filter(o => o.payment_status === 'paid' && o.final_order_amount)
      .reduce((sum, o) => sum + (o.final_order_amount || 0), 0);

    const pendingRevenue = orders
      .filter(o => o.payment_status === 'pending' && o.final_order_amount)
      .reduce((sum, o) => sum + (o.final_order_amount || 0), 0);

    const codRevenue = orders
      .filter(o => o.payment_method === 'cod' && o.payment_status === 'paid' && o.final_order_amount)
      .reduce((sum, o) => sum + (o.final_order_amount || 0), 0);

    const prepaidRevenue = orders
      .filter(o => o.payment_method === 'prepaid' && o.payment_status === 'paid' && o.final_order_amount)
      .reduce((sum, o) => sum + (o.final_order_amount || 0), 0);

    const paidOrders = orders.filter(o => o.payment_status === 'paid').length;
    const pendingPaymentOrders = orders.filter(o => o.payment_status === 'pending').length;
    const failedPaymentOrders = orders.filter(o => o.payment_status === 'failed').length;
    const refundedOrders = orders.filter(o => o.payment_status === 'refunded').length;

    const paidOrdersWithAmount = orders.filter(o => o.payment_status === 'paid' && o.final_order_amount);
    const averageOrderValue = paidOrdersWithAmount.length > 0
      ? totalRevenue / paidOrdersWithAmount.length
      : 0;

    const totalUsers = await User.countDocuments({ role: 'customer' });
    const totalAdmins = await User.countDocuments({ role: 'admin' });
    const totalManagers = await User.countDocuments({ role: 'manager' });
    const totalExecutives = await User.countDocuments({ role: 'executive' });

    const totalProducts = await Product.countDocuments();
    const activeProducts = await Product.countDocuments({ status: 'published' });
    const outOfStockProducts = await Product.countDocuments({ stock: 0 });

    const totalVendors = await Vendor.countDocuments();
    const activeVendors = await Vendor.countDocuments({ status: 'published' });
    const registeredWarehouses = await Vendor.countDocuments({ 'warehouse.status': 'registered' });

    const totalCategories = await Category.countDocuments();

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentOrders = await NewOrder.countDocuments({
      is_deleted: false,
      order_creation_time: { $gte: sevenDaysAgo }
    });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayOrders = await NewOrder.countDocuments({
      is_deleted: false,
      order_creation_time: { $gte: todayStart }
    });

    const todayRevenue = orders
      .filter(o => {
        const orderDate = new Date(o.order_creation_time);
        return orderDate >= todayStart && o.payment_status === 'paid' && o.final_order_amount;
      })
      .reduce((sum, o) => sum + (o.final_order_amount || 0), 0);

    const statusBreakdown = {
      payment_pending: orders.filter(o => o.status === 'payment_pending').length,
      payment_failed: orders.filter(o => o.status === 'payment_failed').length,
      confirmed: confirmedOrders,
      processing: processingOrders,
      ready_to_ship: orders.filter(o => o.status === 'ready_to_ship').length,
      shipped: shippedOrders,
      delivered: deliveredOrders,
      cancelled: cancelledOrders,
      refunded: orders.filter(o => o.status === 'refunded').length,
      pending: orders.filter(o => o.status === 'pending').length, // Legacy status
    };

    // Get payment method breakdown
    const paymentMethodBreakdown = {
      prepaid: orders.filter(o => o.payment_method === 'prepaid').length,
      cod: orders.filter(o => o.payment_method === 'cod').length,
    };

    return {
      overview: {
        totalOrders,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalUsers,
        totalProducts,
        totalVendors,
        averageOrderValue: Math.round(averageOrderValue * 100) / 100,
        recentOrders,
        todayOrders,
        todayRevenue: Math.round(todayRevenue * 100) / 100,
      },
      orders: {
        total: totalOrders,
        pending: pendingOrders,
        confirmed: confirmedOrders,
        processing: processingOrders,
        shipped: shippedOrders,
        delivered: deliveredOrders,
        cancelled: cancelledOrders,
        statusBreakdown,
        paymentMethodBreakdown,
      },
      revenue: {
        total: Math.round(totalRevenue * 100) / 100,
        pending: Math.round(pendingRevenue * 100) / 100,
        cod: Math.round(codRevenue * 100) / 100,
        prepaid: Math.round(prepaidRevenue * 100) / 100,
        averageOrderValue: Math.round(averageOrderValue * 100) / 100,
        today: Math.round(todayRevenue * 100) / 100,
      },
      payments: {
        paid: paidOrders,
        pending: pendingPaymentOrders,
        failed: failedPaymentOrders,
        refunded: refundedOrders,
      },
      users: {
        total: totalUsers,
        admins: totalAdmins,
        managers: totalManagers,
        executives: totalExecutives,
      },
      products: {
        total: totalProducts,
        active: activeProducts,
        outOfStock: outOfStockProducts,
      },
      vendors: {
        total: totalVendors,
        active: activeVendors,
        registeredWarehouses,
      },
      categories: {
        total: totalCategories,
      },
    };
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    throw error;
  }
};

/**
 * Get recent orders for dashboard
 * @param {number} limit - Number of recent orders to fetch
 * @returns {Promise<Array>} Recent orders
 */
const getRecentOrders = async (limit = 10) => {
  try {
    const orders = await NewOrder.find({ is_deleted: false })
      .sort({ order_creation_time: -1 })
      .limit(limit)
      .select('user_order_id user_id status payment_status payment_method final_order_amount order_creation_time shipping_address')
      .lean();

    // Get unique user IDs
    const userIds = [...new Set(orders.map(o => o.user_id).filter(Boolean))];
    
    // Fetch users if user_id is a valid ObjectId, otherwise treat as string
    const userMap = {};
    if (userIds.length > 0) {
      const validObjectIds = userIds.filter(id => mongoose.Types.ObjectId.isValid(id));
      if (validObjectIds.length > 0) {
        const users = await User.find({ _id: { $in: validObjectIds.map(id => new mongoose.Types.ObjectId(id)) } })
          .select('_id name email phoneNumber')
          .lean();
        
        users.forEach(user => {
          userMap[user._id.toString()] = user;
        });
      }
    }

    return orders.map(order => {
      const userId = order.user_id?.toString();
      const user = userId && userMap[userId] ? userMap[userId] : null;
      
      return {
        orderId: order.user_order_id,
        customer: {
          name: user?.name || 'N/A',
          email: user?.email || 'N/A',
          phone: user?.phoneNumber || 'N/A',
        },
        status: order.status,
        paymentStatus: order.payment_status,
        paymentMethod: order.payment_method,
        amount: order.final_order_amount || 0,
        date: order.order_creation_time,
        shippingAddress: order.shipping_address,
      };
    });
  } catch (error) {
    console.error('Error getting recent orders:', error);
    throw error;
  }
};

/**
 * Get sales chart data
 * @param {string} period - 'daily', 'weekly', 'monthly'
 * @param {number} days - Number of days to fetch
 * @returns {Promise<Array>} Sales chart data
 */
const getSalesChartData = async (period = 'daily', days = 30) => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const orders = await NewOrder.find({
      is_deleted: false,
      order_creation_time: { $gte: startDate },
      payment_status: 'paid',
      final_order_amount: { $exists: true, $ne: null }
    })
      .select('order_creation_time final_order_amount')
      .lean();

    // Group by period
    const chartData = {};
    
    orders.forEach(order => {
      const date = new Date(order.order_creation_time);
      let key;
      
      if (period === 'daily') {
        key = date.toISOString().split('T')[0]; // YYYY-MM-DD
      } else if (period === 'weekly') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
      } else if (period === 'monthly') {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }
      
      if (!chartData[key]) {
        chartData[key] = { date: key, revenue: 0, orders: 0 };
      }
      chartData[key].revenue += order.final_order_amount || 0;
      chartData[key].orders += 1;
    });

    // Convert to array and sort by date
    return Object.values(chartData)
      .map(item => ({
        date: item.date,
        revenue: Math.round(item.revenue * 100) / 100,
        orders: item.orders,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  } catch (error) {
    console.error('Error getting sales chart data:', error);
    throw error;
  }
};

/**
 * Get top selling products
 * @param {number} limit - Number of top products to fetch
 * @param {Object} options - Filter options (startDate, endDate)
 * @returns {Promise<Array>} Top selling products
 */
const getTopSellingProducts = async (limit = 10, options = {}) => {
  try {
    const { startDate, endDate } = options;
    
    // Build date filter
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.order_creation_time = {};
      if (startDate) dateFilter.order_creation_time.$gte = new Date(startDate);
      if (endDate) dateFilter.order_creation_time.$lte = new Date(endDate);
    }

    // Base filter (exclude deleted orders, only paid orders)
    const baseFilter = { 
      is_deleted: false, 
      payment_status: 'paid',
      ...dateFilter 
    };

    // Get all paid orders
    const orders = await NewOrder.find(baseFilter)
      .select('vendor_orders order_creation_time')
      .lean();

    // Aggregate product sales
    const productSales = {};

    orders.forEach(order => {
      if (!order.vendor_orders || !Array.isArray(order.vendor_orders)) return;

      order.vendor_orders.forEach(vendorOrder => {
        if (!vendorOrder.products || !Array.isArray(vendorOrder.products)) return;

        vendorOrder.products.forEach(product => {
          // Only count active products (not cancelled)
          if (product.status === 'cancelled') return;

          const productId = product.id;
          const quantity = product.quantity || 0;
          const itemCost = product.item_cost || 0;
          const revenue = quantity * itemCost;

          if (!productSales[productId]) {
            productSales[productId] = {
              productId: productId,
              name: product.name || 'Unknown Product',
              totalQuantity: 0,
              totalRevenue: 0,
              orderCount: 0,
            };
          }

          productSales[productId].totalQuantity += quantity;
          productSales[productId].totalRevenue += revenue;
          productSales[productId].orderCount += 1;
        });
      });
    });

    // Convert to array, sort by total quantity (or revenue), and limit
    const topProducts = Object.values(productSales)
      .map(product => ({
        productId: product.productId,
        name: product.name,
        totalQuantity: product.totalQuantity,
        totalRevenue: Math.round(product.totalRevenue * 100) / 100,
        orderCount: product.orderCount,
        averageOrderValue: product.orderCount > 0
          ? Math.round((product.totalRevenue / product.orderCount) * 100) / 100
          : 0,
      }))
      .sort((a, b) => b.totalQuantity - a.totalQuantity) // Sort by quantity sold
      .slice(0, limit);

    // Populate product details if productId is a valid ObjectId
    const Product = require('../../models/Product');
    const productIds = topProducts
      .map(p => p.productId)
      .filter(id => mongoose.Types.ObjectId.isValid(id))
      .map(id => new mongoose.Types.ObjectId(id));

    if (productIds.length > 0) {
      const products = await Product.find({ _id: { $in: productIds } })
        .select('_id name images sellingPrice stock status sku')
        .lean();

      const productMap = {};
      products.forEach(p => {
        productMap[p._id.toString()] = p;
      });

      // Enrich top products with product details
      topProducts.forEach(topProduct => {
        if (mongoose.Types.ObjectId.isValid(topProduct.productId)) {
          const productIdStr = new mongoose.Types.ObjectId(topProduct.productId).toString();
          const productDetails = productMap[productIdStr];
          if (productDetails) {
            topProduct.productDetails = {
              id: productDetails._id,
              name: productDetails.name,
              images: productDetails.images || [],
              price: productDetails.sellingPrice || 0,
              stock: productDetails.stock || 0,
              status: productDetails.status,
              sku: productDetails.sku,
            };
          }
        }
      });
    }

    return topProducts;
  } catch (error) {
    console.error('Error getting top selling products:', error);
    throw error;
  }
};

module.exports = {
  getDashboardStats,
  getRecentOrders,
  getSalesChartData,
  getTopSellingProducts,
};

