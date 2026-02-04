const { z } = require('zod');

/**
 * List orders validation
 */
const listOrdersValidation = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).optional().transform((val) => (val ? parseInt(val) : 1)),
    limit: z.string().regex(/^\d+$/).optional().transform((val) => (val ? parseInt(val) : 20)),
    status: z.string().optional(),
    payment_status: z.string().optional(),
    payment_method: z.string().optional(),
    user_id: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
    start_date: z.string().datetime().optional(),
    end_date: z.string().datetime().optional(),
  }),
});

/**
 * Get order details validation
 */
const getOrderDetailsValidation = z.object({
  params: z.object({
    id: z.string().min(1, 'Order ID is required'),
  }),
});

/**
 * Update order validation
 */
const updateOrderValidation = z.object({
  params: z.object({
    id: z.string().min(1, 'Order ID is required'),
  }),
  body: z
    .object({
      status: z.string().optional(),
      payment_status: z.string().optional(),
      payment_method: z.string().optional(),
      amount: z.number().optional(),
      discount: z.number().optional(),
      coupon_code: z.string().optional(),
      coupon_discount: z.number().optional(),
      final_order_amount: z.number().optional(),
      currency: z.string().optional(),
      rzp_order_id: z.string().optional(),
      rzp_payment_id: z.string().optional(),
      rzp_signature: z.string().optional(),
      rzp_paid_amount: z.number().optional(),
      shipping_address: z.any().optional(),
      vendor_orders: z.array(z.any()).optional(),
      refund_info: z.any().optional(),
      extra_data: z.any().optional(),
      order_source: z.string().optional(),
      order_channel: z.string().optional(),
      order_type: z.string().optional(),
      order_creation_time: z.string().datetime().optional().transform((val) => (val ? new Date(val) : undefined)),
      confirm_order_time: z.string().datetime().optional().transform((val) => (val ? new Date(val) : undefined)),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field must be provided for update',
    }),
});

/**
 * Reassign order validation
 */
const reassignOrderValidation = z.object({
  params: z.object({
    id: z.string().min(1, 'Order ID is required'),
  }),
  body: z.object({
    user_id: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID format')
      .min(1, 'User ID is required'),
  }),
});

/**
 * Update manual shipment validation
 */
const updateManualShipmentValidation = z.object({
  params: z.object({
    id: z.string().min(1, 'Order ID is required'),
    vendorOrderId: z.string().min(1, 'Vendor Order ID is required'),
  }),
  body: z
    .object({
      waybill_no: z.string().optional(),
      shipping_provider: z.string().optional(),
      shipping_cost: z.number().optional(),
      expected_arrival: z.string().datetime().optional().transform((val) => (val ? new Date(val) : undefined)),
      note: z.string().optional(),
      status: z
        .enum(['processing', 'ready_to_ship', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'pending', 'failed'])
        .optional(),
      shipping_method: z.enum(['manual', 'automatic', 'automatic+manual', 'manual+automatic']).optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field must be provided for update',
    }),
});

/**
 * Cancel order validation
 */
const cancelOrderValidation = z.object({
  params: z.object({
    id: z.string().min(1, 'Order ID is required'),
  }),
  body: z.object({
    cancel_reason: z.string().optional(),
    refund_amount: z.number().min(0).optional(),
    cancel_shipments: z.boolean().optional(),
    admin_note: z.string().optional(),
  }),
});

/**
 * Cancel vendor order validation
 */
const cancelVendorOrderValidation = z.object({
  params: z.object({
    id: z.string().min(1, 'Order ID is required'),
    vendorOrderId: z.string().min(1, 'Vendor Order ID is required'),
  }),
  body: z.object({
    cancel_reason: z.string().optional(),
    refund_amount: z.number().min(0).optional(),
    admin_note: z.string().optional(),
  }),
});

/**
 * Cancel vendor order item validation
 */
const cancelVendorOrderItemValidation = z.object({
  params: z.object({
    id: z.string().min(1, 'Order ID is required'),
    vendorOrderId: z.string().min(1, 'Vendor Order ID is required'),
    productId: z.string().min(1, 'Product ID is required'),
  }),
  body: z.object({
    cancel_reason: z.string().optional(),
    refund_amount: z.number().min(0).optional(),
    admin_note: z.string().optional(),
  }),
});

/**
 * Process partial refund validation
 */
const processPartialRefundValidation = z.object({
  params: z.object({
    id: z.string().min(1, 'Order ID is required'),
  }),
  body: z.object({
    refund_amount: z.number().min(0.01, 'Refund amount must be greater than 0'),
    refund_reason: z.string().optional(),
    admin_note: z.string().optional(),
  }),
});

/**
 * Bulk order operations validation
 */
const bulkOrderOperationsValidation = z.object({
  body: z.object({
    operation: z.enum(['cancel', 'update_status', 'delete'], {
      errorMap: () => ({ message: 'Operation must be one of: cancel, update_status, delete' }),
    }),
    order_ids: z.array(z.string().min(1)).min(1, 'At least one order ID is required'),
    operation_data: z
      .object({
        status: z.string().optional(),
        note: z.string().optional(),
      })
      .optional(),
  }),
});

/**
 * Delete order validation
 */
const deleteOrderValidation = z.object({
  params: z.object({
    id: z.string().min(1, 'Order ID is required'),
  }),
  body: z.object({
    delete_reason: z.string().optional(),
    admin_note: z.string().optional(),
  }),
});

module.exports = {
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
};
