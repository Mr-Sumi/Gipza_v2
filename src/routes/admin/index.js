const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../../middleware/auth');

// All admin routes require authentication and admin/manager role
router.use(authenticate);
router.use(authorize(['admin', 'manager']));

// Import admin route modules
const dashboardRoutes = require('./dashboard.routes');
const userRoutes = require('./user.routes');
const orderRoutes = require('./order.routes');
const productRoutes = require('./product.routes');
const vendorRoutes = require('./vendor.routes');
const categoryRoutes = require('./category.routes');
const colorRoutes = require('./color.routes');
const couponRoutes = require('./coupon.routes');
const analyticsRoutes = require('./analytics.routes');
const bannerRoutes = require('./banner.routes');
const ticketRoutes = require('./ticket.routes');
const listRoutes = require('./list.routes');

// Mount admin route modules
router.use('/dashboard', dashboardRoutes);
router.use('/users', userRoutes);
router.use('/orders', orderRoutes);
router.use('/products', productRoutes);
router.use('/vendors', vendorRoutes);
router.use('/categories', categoryRoutes);
router.use('/colors', colorRoutes);
router.use('/coupons', couponRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/banners', bannerRoutes);
router.use('/tickets', ticketRoutes);
router.use('/lists', listRoutes);

module.exports = router;

