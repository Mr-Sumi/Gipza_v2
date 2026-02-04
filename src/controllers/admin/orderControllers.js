const orderService = require('../../services/admin/orderService');

/**
 * List all orders with pagination and filters
 * GET /api/v1/admin/orders
 */
exports.listOrders = async (req, res) => {
  try {
    const result = await orderService.listOrders(req.query);

    return res.status(200).json({
      success: true,
      orders: result.orders,
      pagination: result.pagination,
      filters_applied: result.filters_applied,
    });
  } catch (error) {
    console.error('Admin list orders failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: error.message,
    });
  }
};

/**
 * Get single order details
 * GET /api/v1/admin/orders/:id
 */
exports.getOrderDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await orderService.getOrderDetails(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    return res.status(200).json({
      success: true,
      order: order,
    });
  } catch (error) {
    console.error('Admin get order details failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch order details',
      error: error.message,
    });
  }
};

/**
 * Update order details
 * PUT /api/v1/admin/orders/:id
 */
exports.updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const adminId = req.user?.id || req.user?._id;

    const updatedOrder = await orderService.updateOrder(id, updates, adminId);

    if (!updatedOrder) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Order updated successfully',
      order: updatedOrder,
    });
  } catch (error) {
    console.error('Admin update order failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update order',
      error: error.message,
    });
  }
};

/**
 * Reassign order to different user
 * PUT /api/v1/admin/orders/:id/reassign
 */
exports.reassignOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.body;
    const adminId = req.user?.id || req.user?._id;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required',
      });
    }

    const result = await orderService.reassignOrder(id, user_id, adminId);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Order reassigned successfully',
      order: result.order,
      previous_user: result.previous_user,
      new_user: result.new_user,
    });
  } catch (error) {
    console.error('Admin reassign order failed:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to reassign order',
      error: error.message,
    });
  }
};

/**
 * Update manual shipment details
 * PUT /api/v1/admin/orders/:id/vendor-orders/:vendorOrderId/shipment
 */
exports.updateManualShipment = async (req, res) => {
  try {
    const { id, vendorOrderId } = req.params;
    const shipmentData = req.body;

    const vendorOrder = await orderService.updateManualShipment(id, vendorOrderId, shipmentData);

    if (!vendorOrder) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Manual shipment updated successfully',
      vendor_order: vendorOrder,
    });
  } catch (error) {
    console.error('Admin update manual shipment failed:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to update manual shipment',
      error: error.message,
    });
  }
};

/**
 * Cancel order
 * POST /api/v1/admin/orders/:id/cancel
 */
exports.cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const cancelData = req.body;

    const result = await orderService.cancelOrder(id, cancelData);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      order: result.order,
      actions_taken: result.actions_taken,
    });
  } catch (error) {
    console.error('Admin cancel order failed:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to cancel order',
      error: error.message,
    });
  }
};

/**
 * Cancel vendor order
 * POST /api/v1/admin/orders/:id/vendor-orders/:vendorOrderId/cancel
 */
exports.cancelVendorOrder = async (req, res) => {
  try {
    const { id, vendorOrderId } = req.params;
    const cancelData = req.body;

    const result = await orderService.cancelVendorOrder(id, vendorOrderId, cancelData);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Vendor order cancelled successfully',
      vendor_order: result.vendor_order,
      order_status: result.order_status,
      refund_amount: result.refund_amount,
    });
  } catch (error) {
    console.error('Admin cancel vendor order failed:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to cancel vendor order',
      error: error.message,
    });
  }
};

/**
 * Cancel product from vendor order
 * POST /api/v1/admin/orders/:id/vendor-orders/:vendorOrderId/products/:productId/cancel
 */
exports.cancelVendorOrderItem = async (req, res) => {
  try {
    const { id, vendorOrderId, productId } = req.params;
    const cancelData = req.body;

    const result = await orderService.cancelVendorOrderItem(id, vendorOrderId, productId, cancelData);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Product cancelled successfully',
      product: result.product,
      vendor_order_status: result.vendor_order_status,
      order_status: result.order_status,
      refund_amount: result.refund_amount,
    });
  } catch (error) {
    console.error('Admin cancel vendor order item failed:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to cancel product',
      error: error.message,
    });
  }
};

/**
 * Process partial refund
 * POST /api/v1/admin/orders/:id/refund
 */
exports.processPartialRefund = async (req, res) => {
  try {
    const { id } = req.params;
    const refundData = req.body;

    const result = await orderService.processPartialRefund(id, refundData);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Partial refund processed successfully',
      refund_info: result.refund_info,
      refund_amount: result.refund_amount,
    });
  } catch (error) {
    console.error('Admin process partial refund failed:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to process refund',
      error: error.message,
    });
  }
};

/**
 * Bulk order operations
 * POST /api/v1/admin/orders/bulk-operations
 */
exports.bulkOrderOperations = async (req, res) => {
  try {
    const { operation, order_ids, operation_data } = req.body;

    if (!operation || !order_ids || !Array.isArray(order_ids)) {
      return res.status(400).json({
        success: false,
        message: 'Operation and order_ids array are required',
      });
    }

    const result = await orderService.bulkOrderOperations(operation, order_ids, operation_data);

    return res.status(200).json({
      success: true,
      message: `Bulk ${operation} operation completed`,
      results: result.results,
      errors: result.errors,
      summary: result.summary,
    });
  } catch (error) {
    console.error('Admin bulk operations failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process bulk operations',
      error: error.message,
    });
  }
};

/**
 * Delete order (soft delete)
 * DELETE /api/v1/admin/orders/:id
 */
exports.deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const deleteData = req.body;

    const result = await orderService.deleteOrder(id, deleteData);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Order deleted successfully',
      deleted_order: result,
    });
  } catch (error) {
    console.error('Admin delete order failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete order',
      error: error.message,
    });
  }
};
