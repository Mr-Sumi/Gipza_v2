const express = require('express');
const router = express.Router();
const orderControllers = require('../controllers/orderControllers');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validator');
const {
  createOrderValidation,
  initiatePaymentValidation,
  confirmPaymentValidation,
  getOrderDetailsValidation,
  listOrdersValidation,
  cancelOrderValidation,
  requestRefundValidation,
  calculateShippingCostValidation,
  checkServiceabilityValidation,
  applyCouponValidation,
  trackOrderValidation,
  trackMultipleOrdersValidation,
  trackMultiVendorOrdersValidation,
  updateDeliveryTrackingValidation,
  createShipmentValidation,
  getAllOrdersValidation,
  updateOrderStatusValidation,
  razorpayWebhookValidation,
  getOrdersByUserIdValidation,
} = require('../validations/order.validation');

// Public routes

router.post('/shipping-estimate', validate(calculateShippingCostValidation), orderControllers.calculateShippingCost);


router.get('/serviceability/:pincode', validate(checkServiceabilityValidation), orderControllers.checkServiceability);


router.post('/apply-coupon', validate(applyCouponValidation), orderControllers.applyCoupon);


router.post('/webhook/razorpay', validate(razorpayWebhookValidation), orderControllers.handleRazorpayWebhook);


router.post('/track-multiple', validate(trackMultipleOrdersValidation), orderControllers.trackMultipleOrders);


//  authenticated routes
router.use(authenticate);


router.post('/', validate(createOrderValidation), orderControllers.createOrder);
router.get('/list', validate(listOrdersValidation), orderControllers.listOrders);



// Payment routes (specific routes first)
router.post('/initiate-payment', validate(initiatePaymentValidation), orderControllers.initiatePayment);
router.post('/confirm-payment', validate(confirmPaymentValidation), orderControllers.confirmPayment);


// Tracking routes (specific routes first)
router.get('/:order_id/track', validate(trackOrderValidation), orderControllers.trackOrder);
router.post('/track-multi-vendor', validate(trackMultiVendorOrdersValidation), orderControllers.trackMultiVendorOrders);



// Order actions (specific routes first)
router.post('/:order_id/cancel', validate(cancelOrderValidation), orderControllers.cancelOrder);
router.post('/:order_id/refund', validate(requestRefundValidation), orderControllers.requestRefund);

// Get order details (must be last to avoid conflicts with other routes)
router.get('/:order_id', validate(getOrderDetailsValidation), orderControllers.getOrderDetails);


// Admin routes require authorization
router.use(authorize('admin'));

// Admin order management (specific routes first)
router.get('/all', validate(getAllOrdersValidation), orderControllers.getAllOrders);
router.get('/test/delhivery', orderControllers.testDelhiveryAPI);
router.get('/tracking/status', orderControllers.getTrackingStatus);
router.post('/tracking/trigger', orderControllers.triggerTracking);
router.get('/:userId/orders', validate(getOrdersByUserIdValidation), orderControllers.getOrdersByUserId);
router.put('/:order_id/status', validate(updateOrderStatusValidation), orderControllers.updateOrderStatus);
router.post('/:order_id/create-shipment', validate(createShipmentValidation), orderControllers.createShipment);
router.post('/:order_id/delivery-tracking', validate(updateDeliveryTrackingValidation), orderControllers.updateDeliveryTracking);

// Note: Coupon management routes have been moved to /api/v1/admin/coupons

module.exports = router;

