const NewOrder = require('../../models/NewOrder');
const User = require('../../models/User');
const Vendor = require('../../models/Vendor');
const mongoose = require('mongoose');

/**
 * List all orders with pagination and filters
 */
const listOrders = async (filters = {}) => {
  const {
    page = 1,
    limit = 20,
    status,
    payment_status,
    payment_method,
    user_id,
    start_date,
    end_date,
  } = filters;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Build filter object
  const filter = { is_deleted: false };
  if (status) filter.status = status;
  if (payment_status) filter.payment_status = payment_status;
  if (payment_method) filter.payment_method = payment_method;
  if (user_id) filter.user_id = new mongoose.Types.ObjectId(user_id);

  // Date range filter
  if (start_date || end_date) {
    filter.order_creation_time = {};
    if (start_date) filter.order_creation_time.$gte = new Date(start_date);
    if (end_date) filter.order_creation_time.$lte = new Date(end_date);
  }

  // Get total count for pagination
  const totalOrders = await NewOrder.countDocuments(filter);

  // Fetch orders with pagination
  const orders = await NewOrder.find(filter)
    .sort({ order_creation_time: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  // Resolve user details in batch
  const userIdSet = new Set();
  for (const o of orders) {
    const possibleId =
      o && o.user_id && typeof o.user_id === 'object' && o.user_id._id
        ? String(o.user_id._id)
        : o && o.user_id
          ? String(o.user_id)
          : '';
    if (possibleId) userIdSet.add(possibleId);
  }
  const userIds = Array.from(userIdSet);
  const users =
    userIds.length > 0
      ? await User.find({ _id: { $in: userIds } })
          .select('name email phoneNumber role gender dateOfBirth addresses createdAt updatedAt')
          .lean()
      : [];
  const userById = new Map(users.map((u) => [String(u._id), u]));

  // Prepare orders list with enriched data
  const ordersList = orders.map((order) => {
    let userDetails = null;
    if (order.user_id && typeof order.user_id === 'object' && order.user_id._id) {
      userDetails = {
        _id: order.user_id._id,
        name: order.user_id.name,
        email: order.user_id.email,
        phoneNumber: order.user_id.phoneNumber,
        role: order.user_id.role,
        gender: order.user_id.gender,
        dateOfBirth: order.user_id.dateOfBirth,
        addresses: order.user_id.addresses,
        createdAt: order.user_id.createdAt,
        updatedAt: order.user_id.updatedAt,
      };
    } else if (order.user_id) {
      const u = userById.get(String(order.user_id));
      if (u) {
        userDetails = {
          _id: u._id,
          name: u.name,
          email: u.email,
          phoneNumber: u.phoneNumber,
          role: u.role,
          gender: u.gender,
          dateOfBirth: u.dateOfBirth,
          addresses: u.addresses,
          createdAt: u.createdAt,
          updatedAt: u.updatedAt,
        };
      }
    }

    return {
      _id: order._id,
      user_order_id: order.user_order_id,
      user: userDetails,
      amount: order.amount,
      discount: order.discount,
      coupon_code: order.coupon_code,
      coupon_discount: order.coupon_discount,
      final_order_amount: order.final_order_amount,
      payment_method: order.payment_method,
      payment_status: order.payment_status,
      status: order.status,
      order_source: order.order_source,
      order_channel: order.order_channel,
      order_type: order.order_type,
      order_creation_time: order.order_creation_time,
      confirm_order_time: order.confirm_order_time,
      shipping_address: order.shipping_address,
      vendor_orders_summary: order.vendor_orders.map((vo) => ({
        sub_order_id: vo.sub_order_id,
        vendor_name: vo.vendor_name,
        status: vo.status,
        waybill_no: vo.waybill_no,
        shipping_cost: vo.shipping_cost,
        note: vo.note,
        products_count: vo.products?.length || 0,
        tracking: vo.tracking?.slice(-1)[0] || null,
      })),
      total_vendor_orders: order.vendor_orders?.length || 0,
      total_products: order.vendor_orders?.reduce((sum, vo) => sum + (vo.products?.length || 0), 0) || 0,
      rzp_order_id: order.rzp_order_id,
      rzp_payment_id: order.rzp_payment_id,
      rzp_paid_amount: order.rzp_paid_amount,
    };
  });

  const totalPages = Math.ceil(totalOrders / parseInt(limit));
  const hasNextPage = parseInt(page) < totalPages;
  const hasPrevPage = parseInt(page) > 1;

  return {
    orders: ordersList,
    pagination: {
      current_page: parseInt(page),
      total_pages: totalPages,
      total_orders: totalOrders,
      limit: parseInt(limit),
      has_next_page: hasNextPage,
      has_prev_page: hasPrevPage,
    },
    filters_applied: {
      status,
      payment_status,
      payment_method,
      user_id,
      start_date,
      end_date,
    },
  };
};

/**
 * Get single order details with full vendor information
 */
const getOrderDetails = async (orderId) => {
  const order = await NewOrder.findOne({
    $or: [{ _id: orderId }, { user_order_id: orderId }],
    is_deleted: false,
  })
    .populate('user_id', 'name email phoneNumber role gender dateOfBirth addresses createdAt updatedAt')
    .lean();

  if (!order) {
    return null;
  }

  // Enrich vendor orders with vendor details
  const enrichedVendorOrders = await Promise.all(
    order.vendor_orders.map(async (vo) => {
      const vendorDetails = await Vendor.findById(vo.vendor_id).lean();
      return {
        ...vo,
        vendor_details: vendorDetails
          ? {
              _id: vendorDetails._id,
              name: vendorDetails.name,
              email: vendorDetails.email,
              contactNumber: vendorDetails.contactNumber,
              address: vendorDetails.address,
              city: vendorDetails.city,
              state: vendorDetails.state,
              pincode: vendorDetails.pincode,
              gstin: vendorDetails.gstin,
              businessName: vendorDetails.businessName,
              companyName: vendorDetails.companyName,
              warehouse: vendorDetails.warehouse,
              is_regsterd_dlevery: vendorDetails.is_regsterd_dlevery,
              vendor_delevery_name: vendorDetails.vendor_delevery_name,
              delhiveryPickupLocationName: vendorDetails.delhiveryPickupLocationName,
            }
          : null,
      };
    })
  );

  // Resolve user details
  let userDetails = null;
  try {
    if (order.user_id && typeof order.user_id === 'object' && order.user_id._id) {
      userDetails = {
        _id: order.user_id._id,
        name: order.user_id.name,
        email: order.user_id.email,
        phoneNumber: order.user_id.phoneNumber,
        role: order.user_id.role,
        gender: order.user_id.gender,
        dateOfBirth: order.user_id.dateOfBirth,
        addresses: order.user_id.addresses,
        createdAt: order.user_id.createdAt,
        updatedAt: order.user_id.updatedAt,
      };
    } else if (order.user_id) {
      const u = await User.findById(order.user_id)
        .select('name email phoneNumber role gender dateOfBirth addresses createdAt updatedAt')
        .lean();
      if (u) {
        userDetails = {
          _id: u._id,
          name: u.name,
          email: u.email,
          phoneNumber: u.phoneNumber,
          role: u.role,
          gender: u.gender,
          dateOfBirth: u.dateOfBirth,
          addresses: u.addresses,
          createdAt: u.createdAt,
          updatedAt: u.updatedAt,
        };
      }
    }
  } catch (e) {
    // Non-fatal; continue without userDetails
  }

  return {
    _id: order._id,
    user_order_id: order.user_order_id,
    user: userDetails,
    amount: order.amount,
    discount: order.discount,
    coupon_code: order.coupon_code,
    coupon_discount: order.coupon_discount,
    final_order_amount: order.final_order_amount,
    currency: order.currency,
    payment_method: order.payment_method,
    payment_status: order.payment_status,
    rzp_order_id: order.rzp_order_id,
    rzp_payment_id: order.rzp_payment_id,
    rzp_signature: order.rzp_signature,
    rzp_paid_amount: order.rzp_paid_amount,
    status: order.status,
    status_history: order.status_history,
    order_source: order.order_source,
    order_channel: order.order_channel,
    order_type: order.order_type,
    order_creation_time: order.order_creation_time,
    confirm_order_time: order.confirm_order_time,
    shipping_address: order.shipping_address,
    vendor_orders: enrichedVendorOrders,
    refund_info: order.refund_info,
    settlement_info: order.settlement_info,
    extra_data: order.extra_data,
    total_vendor_orders: order.vendor_orders?.length || 0,
    total_products: order.vendor_orders?.reduce((sum, vo) => sum + (vo.products?.length || 0), 0) || 0,
    total_shipping_cost: order.vendor_orders?.reduce((sum, vo) => sum + (vo.shipping_cost || 0), 0) || 0,
  };
};

/**
 * Update order details
 */
const updateOrder = async (orderId, updates, adminId) => {
  const order = await NewOrder.findOne({
    $or: [{ _id: orderId }, { user_order_id: orderId }],
    is_deleted: false,
  });

  if (!order) {
    return null;
  }

  const allowedFields = [
    'status',
    'payment_status',
    'payment_method',
    'amount',
    'discount',
    'coupon_code',
    'coupon_discount',
    'final_order_amount',
    'currency',
    'rzp_order_id',
    'rzp_payment_id',
    'rzp_signature',
    'rzp_paid_amount',
    'shipping_address',
    'vendor_orders',
    'refund_info',
    'extra_data',
    'order_source',
    'order_channel',
    'order_type',
    'order_creation_time',
    'confirm_order_time',
  ];

  // Filter updates to only include allowed fields
  const filteredUpdates = {};
  Object.keys(updates).forEach((key) => {
    if (allowedFields.includes(key)) {
      filteredUpdates[key] = updates[key];
    }
  });

  // Add status history entry if status is being updated
  if (updates.status && updates.status !== order.status) {
    filteredUpdates.status_history = [
      ...(order.status_history || []),
      { status: updates.status, at: new Date() },
    ];
  }

  // Update the order
  const updatedOrder = await NewOrder.findByIdAndUpdate(order._id, filteredUpdates, {
    new: true,
    runValidators: true,
  });

  return updatedOrder;
};

/**
 * Reassign order to different user
 */
const reassignOrder = async (orderId, newUserId, adminId) => {
  const order = await NewOrder.findOne({
    $or: [{ _id: orderId }, { user_order_id: orderId }],
    is_deleted: false,
  });

  if (!order) {
    return null;
  }

  // Verify the new user exists
  const newUser = await User.findById(newUserId).select('name email phoneNumber _id').lean();
  if (!newUser) {
    throw new Error('User not found');
  }

  // Get old user details for logging
  const oldUserId = order.user_id;
  let oldUser = null;
  if (oldUserId) {
    try {
      oldUser = await User.findById(oldUserId).select('name email phoneNumber _id').lean();
    } catch (e) {
      // Non-fatal
    }
  }

  // Update the user_id
  order.user_id = newUserId;

  // Add note to extra_data about the reassignment
  if (!order.extra_data) {
    order.extra_data = {};
  }
  if (!order.extra_data.metadata) {
    order.extra_data.metadata = {};
  }
  if (!order.extra_data.metadata.reassignment_history) {
    order.extra_data.metadata.reassignment_history = [];
  }

  order.extra_data.metadata.reassignment_history.push({
    from_user_id: oldUserId,
    from_user_name: oldUser?.name || 'Unknown',
    to_user_id: newUserId,
    to_user_name: newUser.name,
    reassigned_at: new Date(),
    reassigned_by: adminId || 'admin',
  });

  // Mark as modified and save
  order.markModified('extra_data');
  await order.save();

  // Fetch updated order with populated user
  const updatedOrder = await NewOrder.findOne({ _id: order._id })
    .populate('user_id', 'name email phoneNumber role gender dateOfBirth addresses createdAt updatedAt')
    .lean();

  return {
    order: updatedOrder,
    previous_user: oldUser,
    new_user: newUser,
  };
};

/**
 * Update manual shipment details
 */
const updateManualShipment = async (orderId, subOrderId, shipmentData) => {
  const order = await NewOrder.findOne({
    $or: [{ _id: orderId }, { user_order_id: orderId }],
    is_deleted: false,
  });

  if (!order) {
    return null;
  }

  const { waybill_no, shipping_provider, shipping_cost, expected_arrival, note, status, shipping_method } =
    shipmentData;

  // Find the specific vendor order by sub_order_id
  const vendorOrderIndex = order.vendor_orders.findIndex((vo) => vo.sub_order_id === subOrderId);
  if (vendorOrderIndex === -1) {
    throw new Error('Sub order not found');
  }

  const vendorOrder = order.vendor_orders[vendorOrderIndex];

  // Validate that this is a manual delivery order for expected_arrival updates
  if (expected_arrival && vendorOrder.shipping_method !== 'manual') {
    throw new Error('Delivery time can only be updated for manual delivery orders');
  }

  // Update vendor order details (all optional)
  if (waybill_no) vendorOrder.waybill_no = waybill_no;
  if (shipping_provider) vendorOrder.shipping_provider = shipping_provider;
  if (shipping_cost !== undefined) vendorOrder.shipping_cost = shipping_cost;
  if (expected_arrival) vendorOrder.expected_arrival = new Date(expected_arrival);
  if (note) vendorOrder.note = note;
  if (
    shipping_method &&
    ['manual', 'automatic', 'automatic+manual', 'manual+automatic'].includes(String(shipping_method))
  ) {
    vendorOrder.shipping_method = shipping_method;
  }

  // If status provided, append to tracking and set as current status
  const allowedStatuses = [
    'processing',
    'ready_to_ship',
    'shipped',
    'out_for_delivery',
    'delivered',
    'cancelled',
    'pending',
    'failed',
  ];
  if (status) {
    const normalized = String(status).toLowerCase();
    if (!allowedStatuses.includes(normalized)) {
      throw new Error(`Invalid status: ${status}`);
    }
    vendorOrder.status = normalized;
    vendorOrder.tracking.push({
      status: normalized,
      at: new Date(),
      note: note || undefined,
    });
  }

  // If a waybill is provided and no explicit status, default to mark as shipped
  if (waybill_no && !status) {
    vendorOrder.status = 'shipped';
    vendorOrder.tracking.push({
      status: 'shipped',
      at: new Date(),
      note: note || `Manual shipment - Waybill: ${waybill_no}`,
    });
  }

  // Mark as modified and save
  order.markModified('vendor_orders');
  await order.save();

  return vendorOrder;
};

/**
 * Cancel order
 */
const cancelOrder = async (orderId, cancelData) => {
  const { cancel_reason, refund_amount, cancel_shipments, admin_note } = cancelData;

  const order = await NewOrder.findOne({
    $or: [{ _id: orderId }, { user_order_id: orderId }],
    is_deleted: false,
  });

  if (!order) {
    return null;
  }

  if (order.status === 'cancelled') {
    throw new Error('Order is already cancelled');
  }

  // Update order status
  order.status = 'cancelled';
  order.status_history.push({
    status: 'cancelled',
    at: new Date(),
    note: admin_note || `Order cancelled by admin. Reason: ${cancel_reason || 'Not specified'}`,
  });

  // Handle refund if requested
  if (refund_amount && refund_amount > 0) {
    order.refund_info.refund_requested = true;
    order.refund_info.refund_status = 'processing';
    order.refund_info.refund_amount = refund_amount;
    order.payment_status = 'refunded';
  }

  // Handle shipment cancellations if requested
  if (cancel_shipments) {
    order.vendor_orders.forEach((vendorOrder) => {
      if (vendorOrder.waybill_no && vendorOrder.status !== 'cancelled') {
        vendorOrder.status = 'cancelled';
        vendorOrder.tracking.push({
          status: 'cancelled',
          at: new Date(),
          note: `Shipment cancelled by admin. Reason: ${cancel_reason || 'Order cancellation'}`,
        });
        vendorOrder.note = `Shipment cancelled - Waybill: ${vendorOrder.waybill_no}. Reason: ${cancel_reason || 'Order cancellation'}`;
      }
    });
  }

  // Persist cancellation meta for easy display
  order.extra_data = order.extra_data || {};
  order.extra_data.cancel_details = {
    reason: cancel_reason || 'Not specified',
    admin_note: admin_note || null,
    cancelled_at: new Date(),
  };
  // Also add admin note to admin_notes log
  if (admin_note) {
    order.extra_data.admin_notes = order.extra_data.admin_notes || [];
    order.extra_data.admin_notes.push({
      note: admin_note,
      timestamp: new Date(),
      action: 'order_cancellation',
    });
  }

  await order.save();

  return {
    order: {
      _id: order._id,
      user_order_id: order.user_order_id,
      status: order.status,
      payment_status: order.payment_status,
      refund_info: order.refund_info,
      cancelled_at: new Date(),
    },
    actions_taken: {
      order_cancelled: true,
      refund_processed: refund_amount > 0,
      shipments_cancelled: cancel_shipments,
      admin_note_added: !!admin_note,
    },
  };
};

/**
 * Cancel vendor order
 */
const cancelVendorOrder = async (orderId, vendorOrderId, cancelData) => {
  const { cancel_reason, refund_amount, admin_note } = cancelData;

  const order = await NewOrder.findOne({
    $or: [{ _id: orderId }, { user_order_id: orderId }],
    is_deleted: false,
  });

  if (!order) {
    return null;
  }

  // Find the specific vendor order by sub_order_id (vendor orders don't have _id)
  const vendorOrder = order.vendor_orders.find(
    (vo) => vo.sub_order_id === vendorOrderId || (vo._id && vo._id.toString() === vendorOrderId)
  );
  if (!vendorOrder) {
    throw new Error('Vendor order not found');
  }

  // Check if vendor order can be cancelled
  if (vendorOrder.status === 'cancelled') {
    throw new Error('Vendor order is already cancelled');
  }

  if (vendorOrder.status === 'delivered') {
    throw new Error('Cannot cancel delivered vendor order');
  }

  // Cancel the vendor order
  vendorOrder.status = 'cancelled';
  vendorOrder.tracking.push({
    status: 'cancelled',
    at: new Date(),
    note: `Vendor order cancelled by admin. Reason: ${cancel_reason || 'Not specified'}`,
  });
  vendorOrder.note = `Vendor order cancelled. Reason: ${cancel_reason || 'Not specified'}`;

  // Handle partial refund if requested
  if (refund_amount && refund_amount > 0) {
    // Calculate vendor order total
    const vendorOrderTotal = vendorOrder.products.reduce(
      (sum, product) => sum + product.item_cost * product.quantity,
      0
    );

    if (refund_amount > vendorOrderTotal) {
      throw new Error(
        `Refund amount (${refund_amount}) cannot exceed vendor order total (${vendorOrderTotal})`
      );
    }

    // Update refund info
    order.refund_info.refund_requested = true;
    order.refund_info.refund_status = 'processing';
    order.refund_info.refund_amount = (order.refund_info.refund_amount || 0) + refund_amount;
  }

  // Add admin note
  if (admin_note) {
    order.extra_data.admin_notes = order.extra_data.admin_notes || [];
    order.extra_data.admin_notes.push({
      note: admin_note,
      timestamp: new Date(),
      action: 'vendor_order_cancellation',
    });
  }

  // Check if all vendor orders are cancelled
  const allVendorOrdersCancelled = order.vendor_orders.every((vo) => vo.status === 'cancelled');
  if (allVendorOrdersCancelled && order.status !== 'cancelled') {
    order.status = 'cancelled';
    order.status_history.push({
      status: 'cancelled',
      at: new Date(),
      note: 'Order cancelled - All vendor orders cancelled',
    });
  }

  await order.save();

  return {
    vendor_order: {
      _id: vendorOrder._id,
      vendor_id: vendorOrder.vendor_id,
      status: vendorOrder.status,
      cancelled_at: new Date(),
    },
    order_status: order.status,
    refund_amount: refund_amount || 0,
  };
};

/**
 * Cancel product from vendor order
 */
const cancelVendorOrderItem = async (orderId, vendorOrderId, productId, cancelData) => {
  const { cancel_reason, refund_amount, admin_note } = cancelData;

  const order = await NewOrder.findOne({
    $or: [{ _id: orderId }, { user_order_id: orderId }],
    is_deleted: false,
  });

  if (!order) {
    return null;
  }

  // Find the specific vendor order by sub_order_id (vendor orders don't have _id)
  const vendorOrder = order.vendor_orders.find(
    (vo) => vo.sub_order_id === vendorOrderId || (vo._id && vo._id.toString() === vendorOrderId)
  );
  if (!vendorOrder) {
    throw new Error('Vendor order not found');
  }

  // Find the specific product by id
  const product = vendorOrder.products.find((p) => p.id === productId);
  if (!product) {
    throw new Error('Product not found in vendor order');
  }

  // Check if product can be cancelled
  if (product.status === 'cancelled') {
    throw new Error('Product is already cancelled');
  }

  // Cancel the product
  product.status = 'cancelled';
  product.cancelled_at = new Date();
  product.cancel_reason = cancel_reason || 'Not specified';

  // Handle partial refund if requested
  const productTotal = product.item_cost * product.quantity;
  if (refund_amount && refund_amount > 0) {
    if (refund_amount > productTotal) {
      throw new Error(`Refund amount (${refund_amount}) cannot exceed product total (${productTotal})`);
    }

    // Update refund info
    order.refund_info.refund_requested = true;
    order.refund_info.refund_status = 'processing';
    order.refund_info.refund_amount = (order.refund_info.refund_amount || 0) + refund_amount;
  }

  // Add admin note
  if (admin_note) {
    order.extra_data.admin_notes = order.extra_data.admin_notes || [];
    order.extra_data.admin_notes.push({
      note: admin_note,
      timestamp: new Date(),
      action: 'product_cancellation',
    });
  }

  // Check if all products in vendor order are cancelled
  const allProductsCancelled = vendorOrder.products.every((p) => p.status === 'cancelled');
  if (allProductsCancelled && vendorOrder.status !== 'cancelled') {
    vendorOrder.status = 'cancelled';
    vendorOrder.tracking.push({
      status: 'cancelled',
      at: new Date(),
      note: 'Vendor order cancelled - All products cancelled',
    });
  }

  // Check if all vendor orders are cancelled
  const allVendorOrdersCancelled = order.vendor_orders.every((vo) => vo.status === 'cancelled');
  if (allVendorOrdersCancelled && order.status !== 'cancelled') {
    order.status = 'cancelled';
    order.status_history.push({
      status: 'cancelled',
      at: new Date(),
      note: 'Order cancelled - All vendor orders cancelled',
    });
  }

  await order.save();

  return {
    product: {
      id: product.id,
      name: product.name,
      status: product.status,
      cancelled_at: product.cancelled_at,
    },
    vendor_order_status: vendorOrder.status,
    order_status: order.status,
    refund_amount: refund_amount || 0,
  };
};

/**
 * Process partial refund
 */
const processPartialRefund = async (orderId, refundData) => {
  const { refund_amount, refund_reason, admin_note } = refundData;

  if (!refund_amount || refund_amount <= 0) {
    throw new Error('Valid refund amount is required');
  }

  const order = await NewOrder.findOne({
    $or: [{ _id: orderId }, { user_order_id: orderId }],
    is_deleted: false,
  });

  if (!order) {
    return null;
  }

  // Check if refund amount doesn't exceed order total
  if (refund_amount > order.final_order_amount) {
    throw new Error(
      `Refund amount (${refund_amount}) cannot exceed order total (${order.final_order_amount})`
    );
  }

  // Update refund info
  order.refund_info.refund_requested = true;
  order.refund_info.refund_status = 'processing';
  order.refund_info.refund_amount = refund_amount;
  order.refund_info.refund_reason = refund_reason || 'Not specified';

  // Update payment status if full refund
  if (refund_amount >= order.final_order_amount) {
    order.payment_status = 'refunded';
  }

  // Add admin note
  if (admin_note) {
    order.extra_data.admin_notes = order.extra_data.admin_notes || [];
    order.extra_data.admin_notes.push({
      note: admin_note,
      timestamp: new Date(),
      action: 'partial_refund',
    });
  }

  await order.save();

  return {
    refund_info: order.refund_info,
    refund_amount: refund_amount,
  };
};

/**
 * Bulk order operations
 */
const bulkOrderOperations = async (operation, orderIds, operationData) => {
  const results = [];
  const errors = [];

  for (const orderId of orderIds) {
    try {
      let result;

      switch (operation) {
        case 'cancel':
          result = await cancelOrderBulk(orderId, operationData);
          break;
        case 'update_status':
          result = await updateOrderStatusBulk(orderId, operationData);
          break;
        case 'delete':
          result = await deleteOrderBulk(orderId, operationData);
          break;
        default:
          throw new Error(`Unsupported operation: ${operation}`);
      }

      results.push({ order_id: orderId, success: true, result });
    } catch (error) {
      errors.push({ order_id: orderId, success: false, error: error.message });
    }
  }

  return {
    results,
    errors,
    summary: {
      total: orderIds.length,
      successful: results.length,
      failed: errors.length,
    },
  };
};

// Helper functions for bulk operations
async function cancelOrderBulk(orderId, data) {
  const order = await NewOrder.findOne({
    $or: [{ _id: orderId }, { user_order_id: orderId }],
    is_deleted: false,
  });

  if (!order) throw new Error('Order not found');

  order.status = 'cancelled';
  order.status_history.push({
    status: 'cancelled',
    at: new Date(),
    note: data.note || 'Bulk cancellation',
  });

  await order.save();
  return { status: 'cancelled' };
}

async function updateOrderStatusBulk(orderId, data) {
  const order = await NewOrder.findOne({
    $or: [{ _id: orderId }, { user_order_id: orderId }],
    is_deleted: false,
  });

  if (!order) throw new Error('Order not found');

  order.status = data.status;
  order.status_history.push({
    status: data.status,
    at: new Date(),
    note: data.note || 'Bulk status update',
  });

  await order.save();
  return { status: data.status };
}

async function deleteOrderBulk(orderId, data) {
  const order = await NewOrder.findOne({
    $or: [{ _id: orderId }, { user_order_id: orderId }],
    is_deleted: false,
  });

  if (!order) throw new Error('Order not found');

  order.is_deleted = true;
  order.status_history.push({
    status: 'deleted',
    at: new Date(),
    note: data.note || 'Bulk deletion',
  });

  await order.save();
  return { deleted: true };
}

/**
 * Delete order (soft delete)
 */
const deleteOrder = async (orderId, deleteData) => {
  const { delete_reason, admin_note } = deleteData;

  const order = await NewOrder.findOne({
    $or: [{ _id: orderId }, { user_order_id: orderId }],
    is_deleted: false,
  });

  if (!order) {
    return null;
  }

  // Soft delete the order
  order.is_deleted = true;
  order.status_history.push({
    status: 'deleted',
    at: new Date(),
    note: `Order deleted by admin. Reason: ${delete_reason || 'Not specified'}`,
  });

  // Add admin note to extra data
  if (admin_note) {
    order.extra_data = order.extra_data || {};
    order.extra_data.admin_notes = order.extra_data.admin_notes || [];
    order.extra_data.admin_notes.push({
      note: admin_note,
      timestamp: new Date(),
      action: 'order_deletion',
    });
  }

  // Store deletion reason
  order.extra_data = order.extra_data || {};
  order.extra_data.delete_details = {
    reason: delete_reason || 'Not specified',
    admin_note: admin_note || null,
    deleted_at: new Date(),
  };

  await order.save();

  return {
    _id: order._id,
    user_order_id: order.user_order_id,
    deleted: true,
    deleted_at: new Date(),
  };
};

module.exports = {
  listOrders,
  getOrderDetails,
  updateOrder,
  reassignOrder,
  updateManualShipment,
  cancelOrder,
  cancelVendorOrder,
  cancelVendorOrderItem,
  processPartialRefund,
  bulkOrderOperations,
  deleteOrder,
};
