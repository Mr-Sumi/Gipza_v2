const { z } = require('zod');
const mongoose = require('mongoose');

/**
 * MongoDB ObjectId validation
 */
const objectId = z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
  message: 'Invalid ObjectId format',
});

/**
 * Phone number schema
 */
const phoneNumberSchema = z.string()
  .trim()
  .min(10, 'Phone number must be at least 10 digits')
  .max(15, 'Phone number cannot exceed 15 digits')
  .regex(/^\+?(\d{1,3})?[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/, 'Invalid phone number format')
  .transform((val) => val.replace(/^\+91/, '').replace(/[-\s()]/g, ''));

/**
 * Shipping address schema
 */
const shippingAddressSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  street: z.string().trim().min(5, 'Street address must be at least 5 characters'),
  city: z.string().trim().min(2, 'City must be at least 2 characters'),
  state: z.string().trim().min(2, 'State must be at least 2 characters'),
  zipCode: z.string().trim().length(6, 'Zip code must be 6 digits').regex(/^\d+$/, 'Zip code must be numeric'),
  country: z.string().trim().min(2, 'Country must be at least 2 characters').default('India'),
  phone: phoneNumberSchema,
  email: z.string().email('Invalid email format').optional(),
  relationship: z.string().trim().optional(),
});

/**
 * Product customization schema
 */
const customizationSchema = z.object({
  caption: z.string().trim().optional(),
  description: z.string().trim().optional(),
  files: z.array(z.string().min(1, 'File URL cannot be empty')).optional(),
});

/**
 * Product item schema for order
 */
const productItemSchema = z.object({
  id: objectId,
  quantity: z.number().int().positive('Quantity must be a positive number'),
  isCustomizable: z.boolean().optional().default(false),
  customization: customizationSchema.optional().nullable(),
});

/**
 * Create Order Validation
 * POST /api/v1/orders
 */
const createOrderValidation = z.object({
  body: z.object({
    product: z.array(productItemSchema).min(1, 'At least one product is required'),
    shippingAddress: shippingAddressSchema,
    extra_info: z.object({
      method: z.enum(['prepaid', 'cod'], {
        errorMap: () => ({ message: 'Payment method must be either "prepaid" or "cod"' }),
      }).optional(),
      coupon: z.string().trim().optional(),
      notes: z.string().trim().optional(),
      metadata: z.record(z.string(), z.unknown()).optional(),
    }).optional(),
  }),
});

/**
 * Initiate Payment Validation
 * POST /api/v1/orders/initiate-payment
 */
const initiatePaymentValidation = z.object({
  body: z.object({
    user_order_id: z.string().trim().min(1, 'User order ID is required'),
  }),
});

/**
 * Confirm Payment Validation
 * POST /api/v1/orders/confirm-payment
 */
const confirmPaymentValidation = z.object({
  body: z.object({
    order_id: z.string().trim().min(1, 'Razorpay order ID is required'),
    payment_id: z.string().trim().min(1, 'Razorpay payment ID is required'),
    signature: z.string().trim().min(1, 'Payment signature is required'),
  }),
});

/**
 * Get Order Details Validation
 * GET /api/v1/orders/:order_id
 */
const getOrderDetailsValidation = z.object({
  params: z.object({
    order_id: z.string().trim().min(1, 'Order ID is required'),
  }),
});

/**
 * List Orders Validation
 * GET /api/v1/orders/list
 */
const listOrdersValidation = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).optional().transform(Number).pipe(z.number().int().positive()),
    limit: z.string().regex(/^\d+$/).optional().transform(Number).pipe(z.number().int().positive().max(100)),
    status: z.enum([
      'payment_pending',
      'payment_failed',
      'confirmed',
      'processing',
      'ready_to_ship',
      'shipped',
      'delivered',
      'cancelled',
      'refunded',
      'pending',
    ]).optional(),
    payment_status: z.enum(['pending', 'failed', 'paid', 'refunded']).optional(),
    payment_method: z.enum(['prepaid', 'cod']).optional(),
  }).optional(),
});

/**
 * Cancel Order Validation
 * POST /api/v1/orders/:order_id/cancel
 */
const cancelOrderValidation = z.object({
  params: z.object({
    order_id: z.string().trim().min(1, 'Order ID is required'),
  }),
  body: z.object({
    reason: z.string().trim().min(5, 'Cancellation reason must be at least 5 characters').optional(),
  }).optional(),
});

/**
 * Request Refund Validation
 * POST /api/v1/orders/:order_id/refund
 */
const requestRefundValidation = z.object({
  params: z.object({
    order_id: z.string().trim().min(1, 'Order ID is required'),
  }),
  body: z.object({
    reason: z.string().trim().min(5, 'Refund reason must be at least 5 characters'),
    amount: z.number().positive('Refund amount must be positive').optional(),
  }),
});

/**
 * Calculate Shipping Cost Validation
 * POST /api/v1/orders/shipping-estimate
 */
const calculateShippingCostValidation = z.object({
  body: z.object({
    zipCode: z.string().trim().length(6, 'Zip code must be 6 digits').regex(/^\d+$/, 'Zip code must be numeric'),
    productId: objectId,
    quantity: z.number().int().positive('Quantity must be a positive number').default(1),
    paymentMethod: z.enum(['Prepaid', 'COD', 'prepaid', 'cod']).default('Prepaid'),
  }),
});

/**
 * Check Serviceability Validation
 * GET /api/v1/orders/serviceability/:pincode
 */
const checkServiceabilityValidation = z.object({
  params: z.object({
    pincode: z.string().trim().length(6, 'Pincode must be 6 digits').regex(/^\d+$/, 'Pincode must be numeric'),
  }),
});

/**
 * Apply Coupon Validation
 * POST /api/v1/orders/apply-coupon
 */
const applyCouponValidation = z.object({
  body: z.object({
    code: z.string().trim().min(1, 'Coupon code is required'),
    orderAmount: z.number().positive('Order amount must be positive'),
  }),
});

/**
 * Track Order Validation
 * GET /api/v1/orders/:order_id/track
 */
const trackOrderValidation = z.object({
  params: z.object({
    order_id: z.string().trim().min(1, 'Order ID is required'),
  }),
});

/**
 * Track Multiple Orders Validation
 * POST /api/v1/orders/track-multiple
 */
const trackMultipleOrdersValidation = z.object({
  body: z.object({
    waybills: z.array(z.string().trim().min(1, 'Waybill number is required')).min(1, 'At least one waybill is required'),
  }),
});

/**
 * Update Delivery Tracking Validation
 * POST /api/v1/orders/:order_id/delivery-tracking
 */
const updateDeliveryTrackingValidation = z.object({
  params: z.object({
    order_id: z.string().trim().min(1, 'Order ID is required'),
  }),
  body: z.object({
    waybill: z.string().trim().min(1, 'Waybill number is required'),
    status: z.string().trim().min(1, 'Status is required'),
    location: z.string().trim().optional(),
    remarks: z.string().trim().optional(),
  }),
});

/**
 * Create Shipment Validation
 * POST /api/v1/orders/:order_id/create-shipment
 */
const createShipmentValidation = z.object({
  params: z.object({
    order_id: z.string().trim().min(1, 'Order ID is required'),
  }),
});

/**
 * Get All Orders (Admin) Validation
 * GET /api/v1/orders/all
 */
const getAllOrdersValidation = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).optional().transform(Number).pipe(z.number().int().positive()),
    limit: z.string().regex(/^\d+$/).optional().transform(Number).pipe(z.number().int().positive().max(100)),
    status: z.enum([
      'payment_pending',
      'payment_failed',
      'confirmed',
      'processing',
      'ready_to_ship',
      'shipped',
      'delivered',
      'cancelled',
      'refunded',
    ]).optional(),
    payment_status: z.enum(['pending', 'failed', 'paid', 'refunded']).optional(),
    payment_method: z.enum(['prepaid', 'cod']).optional(),
    user_id: objectId.optional(),
  }).optional(),
});

/**
 * Update Order Status Validation
 * PUT /api/v1/orders/:order_id/status
 */
const updateOrderStatusValidation = z.object({
  params: z.object({
    order_id: z.string().trim().min(1, 'Order ID is required'),
  }),
  body: z.object({
    status: z.enum([
      'payment_pending',
      'payment_failed',
      'confirmed',
      'processing',
      'ready_to_ship',
      'shipped',
      'out_for_delivery',
      'delivered',
      'cancelled',
      'refunded',
    ]),
    note: z.string().trim().optional(),
  }),
});

/**
 * Create Coupon Validation
 * POST /api/v1/orders/coupons
 */
const createCouponValidation = z.object({
  body: z.object({
    code: z.string().trim().min(2, 'Coupon code must be at least 2 characters').max(50, 'Coupon code cannot exceed 50 characters'),
    discountType: z.enum(['percentage', 'fixed']),
    discountValue: z.number().positive('Discount value must be positive'),
    minPurchase: z.number().nonnegative('Minimum purchase must be non-negative').default(0),
    expiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expiry date must be in YYYY-MM-DD format'),
    isActive: z.boolean().default(true),
  }),
});

/**
 * Update Coupon Validation
 * PUT /api/v1/orders/coupons/:id
 */
const updateCouponValidation = z.object({
  params: z.object({
    id: objectId,
  }),
  body: z.object({
    code: z.string().trim().min(2, 'Coupon code must be at least 2 characters').max(50, 'Coupon code cannot exceed 50 characters').optional(),
    discountType: z.enum(['percentage', 'fixed']).optional(),
    discountValue: z.number().positive('Discount value must be positive').optional(),
    minPurchase: z.number().nonnegative('Minimum purchase must be non-negative').optional(),
    expiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expiry date must be in YYYY-MM-DD format').optional(),
    isActive: z.boolean().optional(),
  }).refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for coupon update',
    path: ['body'],
  }),
});

/**
 * Get Coupon Validation
 * GET /api/v1/orders/coupons/:id
 */
const getCouponValidation = z.object({
  params: z.object({
    id: objectId,
  }),
});

/**
 * Delete Coupon Validation
 * DELETE /api/v1/orders/coupons/:id
 */
const deleteCouponValidation = z.object({
  params: z.object({
    id: objectId,
  }),
});

/**
 * Get All Coupons Validation
 * GET /api/v1/orders/coupons
 */
const getAllCouponsValidation = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).optional().transform(Number).pipe(z.number().int().positive()),
    limit: z.string().regex(/^\d+$/).optional().transform(Number).pipe(z.number().int().positive().max(100)),
    isActive: z.string().transform(val => val === 'true').pipe(z.boolean()).optional(),
  }).optional(),
});

/**
 * Razorpay Webhook Validation
 * POST /api/v1/orders/webhook/razorpay
 */
const razorpayWebhookValidation = z.object({
  body: z.object({
    event: z.string().trim().min(1, 'Event type is required'),
    payload: z.record(z.string(), z.unknown()),
  }),
});

/**
 * Track Multi-Vendor Orders Validation
 * POST /api/v1/orders/track-multi-vendor
 */
const trackMultiVendorOrdersValidation = z.object({
  body: z.object({
    orderIds: z.array(z.string().trim().min(1, 'Order ID is required')).min(1, 'At least one order ID is required'),
  }),
});

/**
 * Get Orders by User ID Validation
 * GET /api/v1/orders/:userId/orders
 */
const getOrdersByUserIdValidation = z.object({
  params: z.object({
    userId: objectId,
  }),
  query: z.object({
    page: z.string().regex(/^\d+$/).optional().transform(Number).pipe(z.number().int().positive()),
    limit: z.string().regex(/^\d+$/).optional().transform(Number).pipe(z.number().int().positive().max(100)),
    status: z.enum([
      'payment_pending',
      'payment_failed',
      'confirmed',
      'processing',
      'ready_to_ship',
      'shipped',
      'delivered',
      'cancelled',
      'refunded',
    ]).optional(),
  }).optional(),
});

module.exports = {
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
  updateDeliveryTrackingValidation,
  createShipmentValidation,
  getAllOrdersValidation,
  updateOrderStatusValidation,
  createCouponValidation,
  updateCouponValidation,
  getCouponValidation,
  deleteCouponValidation,
  getAllCouponsValidation,
  razorpayWebhookValidation,
  trackMultiVendorOrdersValidation,
  getOrdersByUserIdValidation,
};

