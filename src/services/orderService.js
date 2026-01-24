const mongoose = require('mongoose');
const NewOrder = require('../models/NewOrder');
const Product = require('../models/Product');
const Vendor = require('../models/Vendor');
const Coupon = require('../models/Coupon');

/**
 * Generate unique sub-order ID for vendor order
 */
const generateSubOrderId = (userOrderId, vendorIndex) => {
  return `${userOrderId}-V${String(vendorIndex + 1).padStart(2, '0')}`;
};

/**
 * Split products by vendor
 */
const splitProductsByVendor = async (products) => {
  const vendorMap = new Map();

  for (const product of products) {
    const productDoc = await Product.findById(product.id)
      .select('_id name sellingPrice vendor')
      .populate('vendor', '_id name email phone');
    
    if (!productDoc) {
      throw new Error(`Product ${product.id} not found`);
    }

    if (!productDoc.vendor) {
      throw new Error(`Product ${product.id} has no vendor assigned`);
    }

    const vendorId = String(productDoc.vendor._id);
    
    if (!vendorMap.has(vendorId)) {
      vendorMap.set(vendorId, {
        vendor: productDoc.vendor,
        products: [],
      });
    }

    vendorMap.get(vendorId).products.push({
      id: String(productDoc._id),
      name: productDoc.name,
      quantity: product.quantity,
      item_cost: productDoc.sellingPrice,
      isCustomizable: product.isCustomizable || false,
      customizable: product.customization || undefined,
    });
  }

  return Array.from(vendorMap.values());
};

/**
 * Calculate shipping cost and determine delivery mode
 * Returns both cost and deliveryMode
 */
const calculateShippingCost = async (vendor, userPincode, products, paymentMethod = 'prepaid') => {
  const shippingService = require('./shippingService');
  
  try {
    // Check if all products have the same delivery mode
    const productIds = products.map(p => p.id);
    const productDocs = await Product.find({ _id: { $in: productIds } })
      .select('deliveryMode deliverablePincodes distanceBasedDelivery weight sellingPrice')
      .lean();

    // If only one product, use direct calculation
    if (products.length === 1) {
      const product = productDocs[0];
      if (!product) {
        throw new Error('Product not found');
      }

      const shippingResult = await shippingService.calculateShippingCost(
        products[0].id,
        userPincode,
        products[0].quantity || 1,
        paymentMethod === 'cod' ? 'COD' : 'Prepaid'
      );

      if (!shippingResult.serviceable) {
        throw new Error(shippingResult.message || 'Shipping not available');
      }

      return {
        cost: shippingResult.cost || 50,
        deliveryMode: shippingResult.deliveryMode || 'manual',
        estimatedDelivery: shippingResult.estimatedDelivery || 5,
      };
    }

    // For multiple products, check each product's delivery mode
    // If all products have manual delivery, use the maximum cost from distance ranges
    // If all products have automatic delivery, use Delhivery API with total weight
    // If mixed, prioritize manual for consistency (or use automatic as fallback)

    let hasManual = false;
    let hasAutomatic = false;
    let maxManualCost = 0;
    let maxManualDeliveryDays = 5;
    let totalWeight = 0;
    let orderValue = 0;
    let manualDeliveryMode = null;

    for (const productItem of products) {
      const product = productDocs.find(p => String(p._id) === String(productItem.id));
      if (!product) continue;

      const productWeight = product?.weight || 0.1;
      totalWeight += productWeight * (productItem.quantity || 1);
      orderValue += (product?.sellingPrice || productItem.item_cost || 0) * (productItem.quantity || 1);

      const deliveryMode = product.deliveryMode || 'manual';
      if (deliveryMode === 'manual' || deliveryMode === 'manual+automatic') {
        hasManual = true;
        
        // Calculate manual shipping for this product
        try {
          const manualResult = await shippingService.calculateShippingCost(
            productItem.id,
            userPincode,
            productItem.quantity || 1,
            paymentMethod === 'cod' ? 'COD' : 'Prepaid'
          );
          
          if (manualResult.serviceable && manualResult.deliveryMode === 'manual') {
            if (manualResult.cost > maxManualCost) {
              maxManualCost = manualResult.cost || 0;
              maxManualDeliveryDays = manualResult.estimatedDelivery || 5;
              manualDeliveryMode = 'manual';
            }
          }
        } catch (error) {
          console.warn(`Manual delivery calculation failed for product ${productItem.id}: ${error.message}`);
        }
      }
      
      if (deliveryMode === 'automatic' || deliveryMode === 'automatic+manual') {
        hasAutomatic = true;
      }
    }

    // Priority: If any product has manual delivery configured and available, use manual
    if (hasManual && maxManualCost > 0) {
      return {
        cost: maxManualCost,
        deliveryMode: 'manual',
        estimatedDelivery: maxManualDeliveryDays,
      };
    }

    // If manual not available, try automatic delivery
    if (hasAutomatic) {
      try {
        const shippingDetails = await shippingService.calculateShipping(
          userPincode,
          Math.max(0.5, totalWeight),
          paymentMethod === 'cod' ? 'COD' : 'Prepaid',
          orderValue,
          vendor.pincode
        );

        if (shippingDetails.serviceable) {
          return {
            cost: shippingDetails.cost || 50,
            deliveryMode: 'automatic',
            estimatedDelivery: shippingDetails.estimatedDelivery || 5,
          };
        }
      } catch (error) {
        console.error('Automatic delivery calculation failed:', error.message);
      }
    }

    // Fallback to default shipping cost
    console.warn('Using default shipping cost due to calculation failure');
    return {
      cost: 50,
      deliveryMode: 'manual',
      estimatedDelivery: 5,
    };
  } catch (error) {
    console.error('Error calculating shipping cost:', error.message);
    // Return default shipping cost if calculation fails
    return {
      cost: 50,
      deliveryMode: 'manual',
      estimatedDelivery: 5,
    };
  }
};

/**
 * Create order
 */
const createOrder = async (userId, orderData) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { product: products, shippingAddress, extra_info } = orderData;

    // Validate products
    if (!Array.isArray(products) || products.length === 0) {
      throw new Error('At least one product is required');
    }

    // Split products by vendor
    const vendorGroups = await splitProductsByVendor(products);

    // Calculate totals
    let itemsSubtotal = 0;
    let shippingTotal = 0;

    const vendorOrders = [];
    for (let i = 0; i < vendorGroups.length; i++) {
      const group = vendorGroups[i];
      
      // Determine payment method for shipping calculation
      const paymentMethod = (extra_info?.method || 'prepaid').toLowerCase() === 'cod' ? 'cod' : 'prepaid';
      
      // Calculate shipping cost and determine delivery mode
      const shippingResult = await calculateShippingCost(
        group.vendor, 
        shippingAddress.zipCode,
        group.products,
        paymentMethod
      );
      
      let vendorSubtotal = 0;
      for (const prod of group.products) {
        vendorSubtotal += prod.item_cost * prod.quantity;
        itemsSubtotal += prod.item_cost * prod.quantity;
      }

      shippingTotal += shippingResult.cost;

      // Calculate expected arrival date based on estimated delivery days
      const expectedArrival = shippingResult.estimatedDelivery 
        ? new Date(Date.now() + shippingResult.estimatedDelivery * 24 * 60 * 60 * 1000)
        : null;

      vendorOrders.push({
        vendor_id: group.vendor._id,
        vendor_name: group.vendor.name,
        sub_order_id: generateSubOrderId('TEMP', i), // Will be updated by pre-save hook
        shipping_method: shippingResult.deliveryMode || 'manual', // Use actual delivery mode determined
        shipping_provider: shippingResult.deliveryMode === 'automatic' ? 'Delhivery' : null,
        shipping_cost: shippingResult.cost,
        waybill_no: null,
        expected_arrival: expectedArrival,
        shipment_retry_count: 0,
        status: 'ready_to_ship',
        note: null,
        tracking: [{ status: 'ready_to_ship', at: new Date() }],
        products: group.products,
      });
    }

    // Apply coupon if provided
    let couponCode = extra_info?.coupon || null;
    let couponDiscount = 0;
    
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode, isActive: true })
        .select('code discountType discountValue minPurchase expiryDate')
        .lean();
      const now = new Date();
      
      if (coupon && (!coupon.expiryDate || coupon.expiryDate > now)) {
        if (!coupon.minPurchase || itemsSubtotal >= coupon.minPurchase) {
          if (coupon.discountType === 'percentage') {
            couponDiscount = (itemsSubtotal * coupon.discountValue) / 100;
          } else if (coupon.discountType === 'fixed') {
            couponDiscount = coupon.discountValue;
          }
        } else {
          couponCode = null;
        }
      } else {
        couponCode = null;
      }
    }

    // Calculate final amounts
    const amount = itemsSubtotal + shippingTotal;
    const finalAmount = Math.max(0, amount - couponDiscount);

    // Determine payment method
    const paymentMethod = (extra_info?.method || 'prepaid').toLowerCase() === 'cod' ? 'cod' : 'prepaid';

    // Create order (user_order_id will be generated by pre-save hook)
    const orderArray = await NewOrder.create([{
      user_id: userId,
      amount: Number(amount.toFixed(2)),
      discount: 0,
      coupon_code: couponCode,
      coupon_discount: Number(couponDiscount.toFixed(2)),
      final_order_amount: Number(finalAmount.toFixed(2)),
      currency: 'INR',
      rzp_order_id: null,
      rzp_payment_id: null,
      rzp_signature: null,
      rzp_paid_amount: null,
      payment_method: paymentMethod,
      payment_status: 'pending',
      status: paymentMethod === 'cod' ? 'confirmed' : 'payment_pending',
      status_history: [{ 
        status: paymentMethod === 'cod' ? 'confirmed' : 'payment_pending', 
        at: new Date() 
      }],
      order_source: 'web',
      order_channel: 'web',
      order_type: 'normal',
      vendor_orders: vendorOrders,
      shipping_address: shippingAddress,
      refund_info: {
        refund_requested: false,
        refund_status: 'none',
        refund_amount: 0,
      },
      extra_data: {
        notes: extra_info?.notes || null,
        metadata: extra_info?.metadata || {},
      },
      order_creation_time: new Date(),
      confirm_order_time: paymentMethod === 'cod' ? new Date() : null,
    }], { session });

    const order = orderArray[0];

    // Update sub_order_id for each vendor order now that we have user_order_id
    if (order.user_order_id) {
      for (let i = 0; i < order.vendor_orders.length; i++) {
        order.vendor_orders[i].sub_order_id = generateSubOrderId(order.user_order_id, i);
      }
      await order.save({ session });
    }

    await session.commitTransaction();
    session.endSession();

    return order;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

/**
 * Get order by user_order_id
 */
const getOrderById = async (userId, orderId) => {
  const order = await NewOrder.findOne({
    user_order_id: orderId,
    user_id: userId,
    is_deleted: false,
  })
  .select('-__v')
  .lean();

  if (!order) {
    throw new Error('Order not found');
  }

  return order;
};

/**
 * List orders for user
 */
const listOrders = async (userId, options = {}) => {
  const {
    page = 1,
    limit = 10,
    status,
    payment_status,
    payment_method,
  } = options;

  const query = {
    user_id: userId,
    is_deleted: false,
  };

  if (status) {
    query.status = status;
  }

  if (payment_status) {
    query.payment_status = payment_status;
  }

  if (payment_method) {
    query.payment_method = payment_method;
  }

  const skip = (page - 1) * limit;

  const orders = await NewOrder.find(query)
    .select('-__v -extra_data.metadata')
    .sort({ created_at: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await NewOrder.countDocuments(query);

  return {
    orders,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

/**
 * Cancel order
 */
const cancelOrder = async (userId, orderId, reason) => {
  const order = await NewOrder.findOne({
    user_order_id: orderId,
    user_id: userId,
    is_deleted: false,
  })
  .select('user_order_id status payment_status final_order_amount refund_info status_history');

  if (!order) {
    throw new Error('Order not found');
  }

  // Check if order can be cancelled
  const cancellableStatuses = ['payment_pending', 'payment_failed', 'confirmed', 'processing'];
  if (!cancellableStatuses.includes(order.status)) {
    throw new Error(`Order cannot be cancelled. Current status: ${order.status}`);
  }

  order.status = 'cancelled';
  order.status_history.push({ status: 'cancelled', at: new Date() });
  
  if (order.payment_status === 'paid') {
    order.payment_status = 'refunded';
    order.refund_info = {
      refund_requested: true,
      refund_status: 'pending',
      refund_amount: order.final_order_amount,
      refund_reason: reason || 'Order cancelled by user',
    };
  }

  await order.save();

  return order;
};

/**
 * Request refund
 */
const requestRefund = async (userId, orderId, refundData) => {
  const order = await NewOrder.findOne({
    user_order_id: orderId,
    user_id: userId,
    is_deleted: false,
  })
  .select('user_order_id payment_status final_order_amount refund_info status_history');

  if (!order) {
    throw new Error('Order not found');
  }

  if (order.payment_status !== 'paid') {
    throw new Error('Refund can only be requested for paid orders');
  }

  if (order.refund_info?.refund_requested) {
    throw new Error('Refund already requested for this order');
  }

  const refundAmount = refundData.amount || order.final_order_amount;

  order.refund_info = {
    refund_requested: true,
    refund_status: 'pending',
    refund_amount: refundAmount,
    refund_reason: refundData.reason,
  };

  order.status_history.push({ status: 'refund_requested', at: new Date() });

  await order.save();

  return order;
};

module.exports = {
  createOrder,
  getOrderById,
  listOrders,
  cancelOrder,
  requestRefund,
};

