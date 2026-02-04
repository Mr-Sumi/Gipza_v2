const express = require('express');
const router = express.Router();
const orderControllers = require('../../controllers/admin/orderControllers');
const { validate } = require('../../middleware/validator');
const {
  listOrdersValidation,
  getOrderDetailsValidation,
  updateOrderValidation,
  reassignOrderValidation,
  updateManualShipmentValidation,
  cancelOrderValidation,
  cancelVendorOrderValidation,
  cancelVendorOrderItemValidation,
  processPartialRefundValidation,
  bulkOrderOperationsValidation,
  deleteOrderValidation,
} = require('../../validations/admin/order.validation');

/**
 * @route   GET /api/v1/admin/orders
 * @desc    List all orders with pagination and filters
 * @access  Admin/Manager
 */
router.get('/', validate(listOrdersValidation), orderControllers.listOrders);

/**
 * @route   GET /api/v1/admin/orders/:id
 * @desc    Get single order details with full vendor information
 * @access  Admin/Manager
 */
router.get('/:id', validate(getOrderDetailsValidation), orderControllers.getOrderDetails);

/**
 * @route   PUT /api/v1/admin/orders/:id
 * @desc    Update order details
 * @access  Admin/Manager
 */
router.put('/:id', validate(updateOrderValidation), orderControllers.updateOrder);

/**
 * @route   PUT /api/v1/admin/orders/:id/reassign
 * @desc    Reassign order to different user
 * @access  Admin/Manager
 */
router.put('/:id/reassign', validate(reassignOrderValidation), orderControllers.reassignOrder);

/**
 * @route   PUT /api/v1/admin/orders/:id/vendor-orders/:vendorOrderId/shipment
 * @desc    Update manual shipment details
 * @access  Admin/Manager
 */
router.put(
  '/:id/vendor-orders/:vendorOrderId/shipment',
  validate(updateManualShipmentValidation),
  orderControllers.updateManualShipment
);

/**
 * @route   POST /api/v1/admin/orders/:id/cancel
 * @desc    Cancel order
 * @access  Admin/Manager
 */
router.post('/:id/cancel', validate(cancelOrderValidation), orderControllers.cancelOrder);

/**
 * @route   POST /api/v1/admin/orders/:id/vendor-orders/:vendorOrderId/cancel
 * @desc    Cancel vendor order
 * @access  Admin/Manager
 */
router.post(
  '/:id/vendor-orders/:vendorOrderId/cancel',
  validate(cancelVendorOrderValidation),
  orderControllers.cancelVendorOrder
);

/**
 * @route   POST /api/v1/admin/orders/:id/vendor-orders/:vendorOrderId/products/:productId/cancel
 * @desc    Cancel product from vendor order
 * @access  Admin/Manager
 */
router.post(
  '/:id/vendor-orders/:vendorOrderId/products/:productId/cancel',
  validate(cancelVendorOrderItemValidation),
  orderControllers.cancelVendorOrderItem
);

/**
 * @route   POST /api/v1/admin/orders/:id/refund
 * @desc    Process partial refund
 * @access  Admin/Manager
 */
router.post('/:id/refund', validate(processPartialRefundValidation), orderControllers.processPartialRefund);

/**
 * @route   POST /api/v1/admin/orders/bulk-operations
 * @desc    Bulk order operations (cancel, update_status, delete)
 * @access  Admin/Manager
 */
router.post(
  '/bulk-operations',
  validate(bulkOrderOperationsValidation),
  orderControllers.bulkOrderOperations
);

/**
 * @route   DELETE /api/v1/admin/orders/:id
 * @desc    Delete order (soft delete)
 * @access  Admin/Manager
 */
router.delete('/:id', validate(deleteOrderValidation), orderControllers.deleteOrder);

module.exports = router;
