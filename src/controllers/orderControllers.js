const orderService = require('../services/orderService');
const paymentService = require('../services/paymentService');
const shippingService = require('../services/shippingService');
const couponService = require('../services/couponService');
const NewOrder = require('../models/NewOrder');
const Product = require('../models/Product');
const Vendor = require('../models/Vendor');

/**
 * Create order
 * POST /api/v1/orders
 */
exports.createOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const orderData = req.body;

    const order = await orderService.createOrder(userId, orderData);

    return res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order,
    });
  } catch (error) {
    console.error('Error in createOrder:', error);
    
    let statusCode = 500;
    if (error.message.includes('not found') || error.message.includes('required')) {
      statusCode = 400;
    }

    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to create order',
    });
  }
};

/**
 * Initiate payment
 * POST /api/v1/orders/initiate-payment
 */
exports.initiatePayment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { user_order_id } = req.body;

    if (!user_order_id) {
      return res.status(400).json({
        success: false,
        message: 'user_order_id is required',
      });
    }

    // Fetch order without .lean() to get Mongoose document with .save() method
    const order = await NewOrder.findOne({
      user_order_id,
      user_id: userId,
      is_deleted: false,
    }).select('user_order_id payment_method final_order_amount rzp_order_id payment_status status');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    if (order.payment_method === 'cod') {
      return res.status(400).json({
        success: false,
        message: 'Payment initiation not required for COD orders',
      });
    }

    // Check if order is already paid
    if (order.payment_status === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Order already paid',
      });
    }

    // Check if order is cancelled
    if (order.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot initiate payment for a cancelled order',
      });
    }

    const payableAmount = Number(order.final_order_amount || 0);
    
    if (!payableAmount || payableAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payable amount',
      });
    }

    // If Razorpay order already exists and payment is not paid, return the existing ID
    if (order.rzp_order_id && order.payment_status !== 'paid') {
      console.log(
        `Returning existing Razorpay Order ID ${order.rzp_order_id} for Order ${user_order_id}`
      );
      return res.status(200).json({
        success: true,
        message: 'Payment initiation details retrieved',
        data: {
          razorpayOrderId: order.rzp_order_id,
          amount: payableAmount,
          currency: 'INR',
        },
      });
    }

    console.log(
      `Initiating new Razorpay payment for Order ${user_order_id}, Amount: ${payableAmount}`
    );

    // Initiate new payment with Razorpay service
    const razorpayOrder = await paymentService.initiatePayment(
      payableAmount,
      order.user_order_id
    );

    // Update order with Razorpay order ID (using .save() since order is a Mongoose document)
    if (razorpayOrder?.id) {
      order.rzp_order_id = razorpayOrder.id;
      await order.save();
    }

    return res.status(200).json({
      success: true,
      message: 'Payment initiated successfully',
      data: {
        razorpayOrderId: razorpayOrder.id,
        amount: payableAmount,
        currency: 'INR',
      },
    });
  } catch (error) {
    console.error('Error in initiatePayment:', error);
    
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to initiate payment',
    });
  }
};

/**
 * Confirm payment
 * POST /api/v1/orders/confirm-payment
 */
exports.confirmPayment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { order_id, payment_id, signature } = req.body;

    const order = await NewOrder.findOne({
      rzp_order_id: order_id,
      user_id: userId,
      payment_status: 'pending',
      is_deleted: false,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or already processed',
      });
    }

    // Verify payment
    const verification = await paymentService.verifyPayment(order_id, payment_id, signature);
    
    if (!verification.verified) {
      order.payment_status = 'failed';
      order.status = 'payment_failed';
      order.status_history.push({ status: 'payment_failed', at: new Date() });
      await order.save();

      return res.status(400).json({
        success: false,
        message: 'Payment verification failed',
      });
    }

    // Update order with payment details
    order.rzp_payment_id = payment_id;
    order.rzp_signature = signature;
    order.rzp_paid_amount = order.final_order_amount;
    order.payment_status = 'paid';
    order.status = 'confirmed';
    order.confirm_order_time = new Date();
    order.status_history.push({ status: 'confirmed', at: new Date() });

    // Update vendor orders tracking
    if (Array.isArray(order.vendor_orders)) {
      for (const vo of order.vendor_orders) {
        if (vo && Array.isArray(vo.tracking)) {
          vo.tracking.push({ 
            status: 'processing', 
            at: new Date(), 
            note: 'Payment confirmed' 
          });
        }
      }
    }

    await order.save();

    // Automatically create shipments for vendor orders with automatic shipping (same as old backend)
    const shipmentService = require('../services/shipmentService');
    const shipmentResults = [];
    const failedShipments = [];
    const manualOrders = [];

    for (const vendorOrder of order.vendor_orders) {
      // Skip if waybill already exists
      if (vendorOrder.waybill_no) {
        shipmentResults.push({
          vendorOrderId: vendorOrder.sub_order_id,
          success: true,
          waybill: vendorOrder.waybill_no,
          message: 'Shipment already exists',
          existing: true,
        });
        continue;
      }

      // Skip manual shipping methods
      if (vendorOrder.shipping_method === 'manual') {
        manualOrders.push({
          vendorOrderId: vendorOrder.sub_order_id,
          vendorName: vendorOrder.vendor_name,
          message: 'Manual shipping method - shipment creation skipped',
        });
        continue;
      }

      // For automatic shipping, check if vendor warehouse is registered
      const Vendor = require('../models/Vendor');
      const vendor = await Vendor.findById(vendorOrder.vendor_id)
        .select('name address pincode city state country contactNumber email warehouse vendor_delevery_name delhiveryPickupLocationName is_regsterd_dlevery')
        .lean();

      if (!vendor) {
        const errorNote = `Vendor not found: ${vendorOrder.vendor_id}`;
        vendorOrder.status = 'pending';
        vendorOrder.note = errorNote;
        vendorOrder.tracking.push({ status: 'pending', at: new Date(), note: errorNote });
        failedShipments.push({
          vendorOrderId: vendorOrder.sub_order_id,
          vendorName: vendorOrder.vendor_name,
          error: 'Vendor not found',
          note: errorNote,
        });
        continue;
      }

      // Check if vendor warehouse is registered
      const vendorHasRegisteredWarehouse = !!(
        vendor.warehouse?.status === 'registered' ||
        vendor.is_regsterd_dlevery === true ||
        vendor.vendor_delevery_name ||
        vendor.delhiveryPickupLocationName
      );

      if (!vendorHasRegisteredWarehouse) {
        const errorNote = `Vendor warehouse not registered: ${vendor.name}`;
        vendorOrder.status = 'pending';
        vendorOrder.note = errorNote;
        vendorOrder.tracking.push({ status: 'pending', at: new Date(), note: errorNote });
        failedShipments.push({
          vendorOrderId: vendorOrder.sub_order_id,
          vendorName: vendor.name,
          error: 'Vendor warehouse not registered',
          note: errorNote,
        });
        continue;
      }

      // Create shipment for this vendor order
      try {
        const shipmentResult = await shipmentService.createDelhiveryShipment(vendorOrder, vendor, order);

        if (shipmentResult.success && shipmentResult.waybill) {
          // Update vendor order with waybill
          vendorOrder.waybill_no = shipmentResult.waybill;
          vendorOrder.shipping_provider = 'Delhivery';
          vendorOrder.status = 'shipped';
          vendorOrder.tracking.push({
            status: 'shipped',
            at: new Date(),
            note: `Shipment created successfully - Waybill: ${shipmentResult.waybill}`,
          });

          shipmentResults.push({
            vendorOrderId: vendorOrder.sub_order_id,
            vendorName: vendor.name,
            waybill: shipmentResult.waybill,
            success: true,
            message: 'Shipment created successfully',
          });
        } else {
          throw new Error(shipmentResult.error || 'Shipment creation failed');
        }
      } catch (error) {
        console.error(`Failed to create shipment for vendor order ${vendorOrder.sub_order_id}:`, error.message);
        const errorNote = `Shipment creation failed: ${error.message}`;
        vendorOrder.status = 'pending';
        vendorOrder.note = errorNote;
        vendorOrder.tracking.push({ status: 'pending', at: new Date(), note: errorNote });

        failedShipments.push({
          vendorOrderId: vendorOrder.sub_order_id,
          vendorName: vendor.name,
          error: error.message,
          note: errorNote,
        });
      }
    }

    // Update order status based on shipment results
    if (failedShipments.length > 0 && shipmentResults.length === 0) {
      // All shipments failed
      order.status = 'pending';
      order.status_history.push({
        status: 'pending',
        at: new Date(),
        note: `${failedShipments.length} vendor orders have shipment creation issues`,
      });
    } else if (shipmentResults.length > 0) {
      // At least some shipments succeeded
      order.status = 'processing';
      order.status_history.push({
        status: 'processing',
        at: new Date(),
        note: `Shipments created: ${shipmentResults.length} successful, ${failedShipments.length} failed`,
      });
    }

    await order.save();

    return res.status(200).json({
      success: true,
      message: 'Payment confirmed successfully',
      data: {
        id: order._id,
        user_order_id: order.user_order_id,
        status: order.status,
        payment_status: order.payment_status,
        confirm_order_time: order.confirm_order_time,
      },
      shipments: shipmentResults,
      failed_shipments: failedShipments,
      manual_orders: manualOrders,
      summary: {
        total_vendor_orders: order.vendor_orders.length,
        successful_shipments: shipmentResults.length,
        failed_shipments: failedShipments.length,
        manual_orders: manualOrders.length,
      },
    });
  } catch (error) {
    console.error('Error in confirmPayment:', error);
    
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to confirm payment',
    });
  }
};

/**
 * Get order details
 * GET /api/v1/orders/:order_id
 */
exports.getOrderDetails = async (req, res) => {
  try {
    const userId = req.user.id;
    const { order_id } = req.params;

    const order = await orderService.getOrderById(userId, order_id);

    return res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('Error in getOrderDetails:', error);
    
    const statusCode = error.message === 'Order not found' ? 404 : 500;
    
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to get order details',
    });
  }
};

/**
 * List orders
 * GET /api/v1/orders/list
 */
exports.listOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page, limit, status, payment_status, payment_method } = req.query;

    const result = await orderService.listOrders(userId, {
      page,
      limit,
      status,
      payment_status,
      payment_method,
    });

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Error in listOrders:', error);
    
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to list orders',
    });
  }
};

/**
 * Cancel order
 * POST /api/v1/orders/:order_id/cancel
 */
exports.cancelOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { order_id } = req.params;
    const { reason } = req.body;

    const order = await orderService.cancelOrder(userId, order_id, reason);

    return res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      data: order,
    });
  } catch (error) {
    console.error('Error in cancelOrder:', error);
    
    let statusCode = 500;
    if (error.message === 'Order not found') {
      statusCode = 404;
    } else if (error.message.includes('cannot be cancelled')) {
      statusCode = 400;
    }
    
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to cancel order',
    });
  }
};

/**
 * Request refund
 * POST /api/v1/orders/:order_id/refund
 */
exports.requestRefund = async (req, res) => {
  try {
    const userId = req.user.id;
    const { order_id } = req.params;
    const refundData = req.body;

    const order = await orderService.requestRefund(userId, order_id, refundData);

    return res.status(200).json({
      success: true,
      message: 'Refund requested successfully',
      data: order,
    });
  } catch (error) {
    console.error('Error in requestRefund:', error);
    
    let statusCode = 500;
    if (error.message === 'Order not found') {
      statusCode = 404;
    } else if (error.message.includes('Refund') || error.message.includes('paid')) {
      statusCode = 400;
    }
    
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to request refund',
    });
  }
};

/**
 * Calculate shipping cost
 * POST /api/v1/orders/shipping-estimate
 */
exports.calculateShippingCost = async (req, res) => {
  try {
    const { zipCode, productId, quantity, paymentMethod } = req.body;

    const result = await shippingService.calculateShippingCost(
      productId,
      zipCode,
      quantity || 1,
      paymentMethod || 'Prepaid'
    );

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Error in calculateShippingCost:', error);
    
    let statusCode = 500;
    if (error.message.includes('not found') || error.message.includes('Invalid')) {
      statusCode = 400;
    }
    
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to calculate shipping cost',
    });
  }
};

/**
 * Check serviceability
 * GET /api/v1/orders/serviceability/:pincode
 */
exports.checkServiceability = async (req, res) => {
  try {
    const { pincode } = req.params;

    const result = await shippingService.checkServiceability(pincode);

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Error in checkServiceability:', error);
    
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to check serviceability',
    });
  }
};

/**
 * Apply coupon
 * POST /api/v1/orders/apply-coupon
 */
exports.applyCoupon = async (req, res) => {
  try {
    const { code, orderAmount } = req.body;

    const result = await couponService.applyCoupon(code, orderAmount);

    return res.status(200).json({
      success: true,
      message: 'Coupon applied successfully',
      ...result,
    });
  } catch (error) {
    console.error('Error in applyCoupon:', error);
    
    let statusCode = 400;
    if (error.message.includes('not found')) {
      statusCode = 404;
    }
    
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to apply coupon',
    });
  }
};

/**
 * Track order
 * GET /api/v1/orders/:order_id/track
 */
exports.trackOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { order_id } = req.params;

    const order = await NewOrder.findOne({
      user_order_id: order_id,
      user_id: userId,
      is_deleted: false,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Track all vendor orders with waybills
    const trackingPromises = order.vendor_orders
      .filter((vo) => vo.waybill_no)
      .map(async (vo) => {
        try {
          const tracking = await shippingService.trackShipment(vo.waybill_no);
          return {
            sub_order_id: vo.sub_order_id,
            waybill: vo.waybill_no,
            tracking,
          };
        } catch (error) {
          return {
            sub_order_id: vo.sub_order_id,
            waybill: vo.waybill_no,
            error: error.message,
          };
        }
      });

    const trackingResults = await Promise.all(trackingPromises);

    return res.status(200).json({
      success: true,
      order_id: order.user_order_id,
      tracking: trackingResults,
    });
  } catch (error) {
    console.error('Error in trackOrder:', error);
    
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to track order',
    });
  }
};

/**
 * Track multiple orders
 * POST /api/v1/orders/track-multiple
 */
exports.trackMultipleOrders = async (req, res) => {
  try {
    const { waybills } = req.body;

    const results = await shippingService.trackMultipleShipments(waybills);

    return res.status(200).json({
      success: true,
      tracking: results,
    });
  } catch (error) {
    console.error('Error in trackMultipleOrders:', error);
    
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to track orders',
    });
  }
};

/**
 * Update delivery tracking
 * POST /api/v1/orders/:order_id/delivery-tracking
 */
exports.updateDeliveryTracking = async (req, res) => {
  try {
    const { order_id } = req.params;
    const { waybill, status, location, remarks } = req.body;

    const order = await NewOrder.findOne({
      user_order_id: order_id,
      is_deleted: false,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Find vendor order with matching waybill
    const vendorOrder = order.vendor_orders.find((vo) => vo.waybill_no === waybill);
    if (!vendorOrder) {
      return res.status(404).json({
        success: false,
        message: 'Waybill not found in this order',
      });
    }

    // Update tracking
    vendorOrder.tracking = vendorOrder.tracking || [];
    vendorOrder.tracking.push({
      status,
      location,
      remarks,
      updated_at: new Date(),
    });

    // Update vendor order status if provided
    if (status) {
      vendorOrder.status = status;
    }

    await order.save();

    return res.status(200).json({
      success: true,
      message: 'Tracking updated successfully',
      data: {
        order_id: order.user_order_id,
        waybill,
        tracking: vendorOrder.tracking,
      },
    });
  } catch (error) {
    console.error('Error in updateDeliveryTracking:', error);
    
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to update tracking',
    });
  }
};

/**
 * Create shipment (Admin)
 * POST /api/v1/orders/:order_id/create-shipment
 */
exports.createShipment = async (req, res) => {
  try {
    const { order_id } = req.params;
    const shipmentService = require('../services/shipmentService');

    const order = await NewOrder.findOne({
      user_order_id: order_id,
      is_deleted: false,
      status: { $in: ['confirmed', 'processing'] }, // Only create shipments for confirmed orders
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or not in confirmed/processing status',
      });
    }

    // Check if order is paid (for prepaid orders)
    if (order.payment_method === 'prepaid' && order.payment_status !== 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Cannot create shipment for unpaid order. Payment must be confirmed first.',
      });
    }

    // Create shipments for all vendor orders
    const shipmentResults = await shipmentService.createShipmentsForOrder(order);

    // Update order with waybill numbers
    let hasUpdates = false;
    for (const result of shipmentResults) {
      if (result.success && result.waybill) {
        const vendorOrder = order.vendor_orders.find(vo => vo.sub_order_id === result.sub_order_id);
        if (vendorOrder && !vendorOrder.waybill_no) {
          vendorOrder.waybill_no = result.waybill;
          vendorOrder.shipping_provider = 'Delhivery';
          vendorOrder.status = 'shipped';
          vendorOrder.tracking = vendorOrder.tracking || [];
          vendorOrder.tracking.push({
            status: 'shipped',
            at: new Date(),
            note: 'Shipment created with Delhivery',
          });
          hasUpdates = true;
        }
      } else if (result.error) {
        // Log error but don't fail the entire request
        console.error(`Failed to create shipment for ${result.sub_order_id}:`, result.error);
      }
    }

    // Update main order status if any shipments were created
    if (hasUpdates) {
      if (order.status === 'confirmed') {
        order.status = 'processing';
        order.status_history = order.status_history || [];
        order.status_history.push({
          status: 'processing',
          at: new Date(),
          note: 'Shipments created',
        });
      }
      await order.save();
    }

    const successCount = shipmentResults.filter(r => r.success).length;
    const failureCount = shipmentResults.filter(r => !r.success && !r.skipped).length;
    const skippedCount = shipmentResults.filter(r => r.skipped).length;

    return res.status(200).json({
      success: true,
      message: `Shipment creation completed: ${successCount} successful, ${failureCount} failed, ${skippedCount} skipped`,
      data: {
        order_id: order.user_order_id,
        total_vendor_orders: order.vendor_orders.length,
        shipments_created: successCount,
        shipments_failed: failureCount,
        shipments_skipped: skippedCount,
        results: shipmentResults,
      },
    });
  } catch (error) {
    console.error('Error in createShipment:', error);
    
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to create shipment',
    });
  }
};

/**
 * Get all orders (Admin)
 * GET /api/v1/orders/all
 */
exports.getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, payment_status, payment_method, user_id } = req.query;

    const filter = { is_deleted: false };
    if (status) filter.status = status;
    if (payment_status) filter.payment_status = payment_status;
    if (payment_method) filter.payment_method = payment_method;
    if (user_id) filter.user_id = user_id;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [orders, total] = await Promise.all([
      NewOrder.find(filter)
        .sort({ order_creation_time: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('user_id', 'name email phoneNumber')
        .lean(),
      NewOrder.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      orders,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / parseInt(limit)),
        total_orders: total,
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error('Error in getAllOrders:', error);
    
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch orders',
    });
  }
};

/**
 * Update order status (Admin)
 * PUT /api/v1/orders/:order_id/status
 */
exports.updateOrderStatus = async (req, res) => {
  try {
    const { order_id } = req.params;
    const { status, note } = req.body;

    const order = await NewOrder.findOne({
      user_order_id: order_id,
      is_deleted: false,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Update status
    order.status = status;

    // Add to status history
    order.status_history = order.status_history || [];
    order.status_history.push({
      status,
      note,
      updated_at: new Date(),
      updated_by: req.user.id,
    });

    await order.save();

    return res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      data: {
        order_id: order.user_order_id,
        status: order.status,
        status_history: order.status_history,
      },
    });
  } catch (error) {
    console.error('Error in updateOrderStatus:', error);
    
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to update order status',
    });
  }
};

/**
 * Razorpay webhook
 * POST /api/v1/orders/webhook/razorpay
 */
exports.handleRazorpayWebhook = async (req, res) => {
  try {
    const { event, payload } = req.body;

    // Verify webhook signature (in production, verify Razorpay signature)
    // For now, process the webhook

    if (event === 'payment.captured') {
      const { order_id, payment_id } = payload.payment.entity;

      // Find order by Razorpay order ID
      const order = await NewOrder.findOne({
        'payment_details.razorpay_order_id': order_id,
        is_deleted: false,
      });

      if (order && order.payment_status !== 'paid') {
        // Update payment status
        order.payment_status = 'paid';
        order.status = 'confirmed';
        order.payment_details = {
          ...order.payment_details,
          razorpay_order_id: order_id,
          razorpay_payment_id: payment_id,
          paid_at: new Date(),
        };
        order.confirm_order_time = new Date();

        await order.save();
      }
    }

    // Always return 200 to acknowledge webhook receipt
    return res.status(200).json({
      success: true,
      message: 'Webhook received',
    });
  } catch (error) {
    console.error('Error in handleRazorpayWebhook:', error);
    
    // Still return 200 to prevent Razorpay from retrying
    return res.status(200).json({
      success: false,
      message: 'Webhook processing failed',
    });
  }
};

/**
 * Track multi-vendor orders
 * POST /api/v1/orders/track-multi-vendor
 */
exports.trackMultiVendorOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const { orderIds } = req.body;

    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of order IDs to track',
      });
    }

    // Find orders for the authenticated user
    const orders = await NewOrder.find({
      user_order_id: { $in: orderIds },
      user_id: userId,
      is_deleted: false,
    });

    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No orders found with the provided IDs',
      });
    }

    // Process tracking for each order
    const trackingResults = await Promise.all(
      orders.map(async (order) => {
        try {
          const result = {
            user_order_id: order.user_order_id,
            status: order.status,
            payment_status: order.payment_status,
            vendor_orders: [],
          };

          // Track each vendor order
          for (const vendorOrder of order.vendor_orders) {
            const vendorTracking = {
              sub_order_id: vendorOrder.sub_order_id,
              vendor_name: vendorOrder.vendor_name,
              status: vendorOrder.status,
              waybill_no: vendorOrder.waybill_no,
              shipping_method: vendorOrder.shipping_method,
            };

            // If waybill exists, try to track it
            if (vendorOrder.waybill_no) {
              try {
                const tracking = await shippingService.trackShipment(vendorOrder.waybill_no);
                vendorTracking.tracking = tracking;
              } catch (error) {
                vendorTracking.tracking_error = error.message;
              }
            }

            // Add tracking history if available
            if (vendorOrder.tracking && vendorOrder.tracking.length > 0) {
              vendorTracking.tracking_history = vendorOrder.tracking;
            }

            result.vendor_orders.push(vendorTracking);
          }

          return result;
        } catch (error) {
          return {
            user_order_id: order.user_order_id,
            error: error.message,
            success: false,
          };
        }
      })
    );

    // Group by vendor for easier frontend processing
    const vendorGroupedResults = {};
    trackingResults.forEach((result) => {
      if (result.vendor_orders) {
        result.vendor_orders.forEach((vo) => {
          const vendorName = vo.vendor_name || 'unknown';
          if (!vendorGroupedResults[vendorName]) {
            vendorGroupedResults[vendorName] = [];
          }
          vendorGroupedResults[vendorName].push({
            user_order_id: result.user_order_id,
            sub_order_id: vo.sub_order_id,
            ...vo,
          });
        });
      }
    });

    return res.status(200).json({
      success: true,
      message: `Tracking information retrieved for ${trackingResults.length} orders`,
      orderCount: trackingResults.length,
      trackingResults,
      vendorGroupedResults,
    });
  } catch (error) {
    console.error('Error in trackMultiVendorOrders:', error);
    
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to track multi-vendor orders',
    });
  }
};

/**
 * Test Delhivery API
 * GET /api/v1/orders/test/delhivery
 */
exports.testDelhiveryAPI = async (req, res) => {
  try {
    console.log('Testing Delhivery API connectivity...');

    // Test with a simple rate calculation
    const testParams = {
      origin: '110001', // Delhi
      destination: '400001', // Mumbai
      weight: 0.5, // 0.5 kg
      paymentMode: 'Pre-paid',
      orderValue: 1000, // ₹1000
    };

    console.log('Test parameters:', testParams);

    try {
      const shippingDetails = await shippingService.calculateShipping(
        testParams.destination,
        testParams.weight,
        testParams.paymentMode,
        testParams.orderValue,
        testParams.origin
      );

      return res.status(200).json({
        success: true,
        message: 'Delhivery API test successful',
        testParams,
        response: shippingDetails,
      });
    } catch (apiError) {
      return res.status(500).json({
        success: false,
        message: 'Delhivery API test failed',
        error: apiError.message,
        testParams,
      });
    }
  } catch (error) {
    console.error('Error in testDelhiveryAPI:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Failed to test Delhivery API',
      error: error.message,
    });
  }
};

/**
 * Get tracking status
 * GET /api/v1/orders/tracking/status
 */
exports.getTrackingStatus = async (req, res) => {
  try {
    // Count orders with tracking information
    const activeShipments = await NewOrder.countDocuments({
      'vendor_orders.waybill_no': { $exists: true, $ne: null },
      status: { $in: ['shipped', 'out_for_delivery', 'ready_to_ship'] },
      is_deleted: false,
    });

    const totalTrackedOrders = await NewOrder.countDocuments({
      'vendor_orders.tracking': { $exists: true, $ne: [] },
      is_deleted: false,
    });

    return res.status(200).json({
      success: true,
      trackingJobStatus: {
        enabled: true,
        lastRun: new Date().toISOString(),
      },
      statistics: {
        activeShipments,
        totalTrackedOrders,
        lastChecked: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error getting tracking status:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Failed to get tracking status',
      error: error.message,
    });
  }
};

/**
 * Trigger tracking job
 * POST /api/v1/orders/tracking/trigger
 */
exports.triggerTracking = async (req, res) => {
  try {
    console.log(`Manual tracking trigger requested by user: ${req.user?.id || 'admin'}`);

    // Find orders with waybills that need tracking
    const ordersToTrack = await NewOrder.find({
      'vendor_orders.waybill_no': { $exists: true, $ne: null },
      status: { $in: ['shipped', 'out_for_delivery', 'ready_to_ship'] },
      is_deleted: false,
    }).limit(50); // Process 50 at a time

    let updatedCount = 0;
    let errorCount = 0;

    for (const order of ordersToTrack) {
      try {
        let orderUpdated = false;

        for (const vendorOrder of order.vendor_orders) {
          if (vendorOrder.waybill_no) {
            try {
              const tracking = await shippingService.trackShipment(vendorOrder.waybill_no);
              
              // Update vendor order tracking
              if (!vendorOrder.tracking) {
                vendorOrder.tracking = [];
              }

              // Add new tracking entry if status changed
              const latestStatus = tracking.status || 'Unknown';
              const lastTracking = vendorOrder.tracking[vendorOrder.tracking.length - 1];
              
              if (!lastTracking || lastTracking.status !== latestStatus) {
                vendorOrder.tracking.push({
                  status: latestStatus,
                  at: new Date(),
                  note: tracking.statusDescription || '',
                });

                // Update vendor order status based on tracking
                if (latestStatus.toLowerCase().includes('delivered')) {
                  vendorOrder.status = 'delivered';
                } else if (latestStatus.toLowerCase().includes('out for delivery')) {
                  vendorOrder.status = 'out_for_delivery';
                } else if (latestStatus.toLowerCase().includes('shipped') || latestStatus.toLowerCase().includes('dispatched')) {
                  vendorOrder.status = 'shipped';
                }

                orderUpdated = true;
              }
            } catch (trackingError) {
              console.warn(`Error tracking waybill ${vendorOrder.waybill_no}:`, trackingError.message);
              errorCount++;
            }
          }
        }

        if (orderUpdated) {
          await order.save();
          updatedCount++;
        }
      } catch (orderError) {
        console.error(`Error processing order ${order.user_order_id}:`, orderError.message);
        errorCount++;
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Tracking job triggered successfully',
      triggeredAt: new Date().toISOString(),
      triggeredBy: req.user?.id || 'admin',
      results: {
        ordersProcessed: ordersToTrack.length,
        ordersUpdated: updatedCount,
        errors: errorCount,
      },
    });
  } catch (error) {
    console.error('Error triggering tracking job:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Failed to trigger tracking job',
      error: error.message,
    });
  }
};

/**
 * Get orders by user ID (Admin)
 * GET /api/v1/orders/:userId/orders
 */
exports.getOrdersByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10, status } = req.query;

    const filter = {
      user_id: userId,
      is_deleted: false,
    };

    if (status) {
      filter.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [orders, total] = await Promise.all([
      NewOrder.find(filter)
        .sort({ order_creation_time: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('user_id', 'name email phoneNumber')
        .lean(),
      NewOrder.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      orders,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / parseInt(limit)),
        total_orders: total,
        limit: parseInt(limit),
      },
      user_id: userId,
    });
  } catch (error) {
    console.error('Error in getOrdersByUserId:', error);
    
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch orders',
    });
  }
};

