const mongoose = require("mongoose");

function roundToTwo(num) {
  if (num == null || isNaN(num)) return null;
  return Math.round(num * 100) / 100;
}

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    products: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        sku: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
        priceAtOrder: {
          // Store price to avoid issues if product price changes later
          type: Number,
          required: true,
          get: (v) => (v != null ? v.toFixed(2) : null),
          set: (v) => (v != null ? roundToTwo(parseFloat(v)) : null),
        },
        customization: {
          caption: String,
          description: String,
          files: [String],
        },
      },
    ],
    totalAmount: {
      // Final amount including shipping and after discounts
      type: Number,
      required: [true, "Total amount is required"],
      min: [0, "Total amount must be a non-negative number"],
      get: (v) => (v != null ? v.toFixed(2) : null),
      set: (v) => (v != null ? roundToTwo(parseFloat(v)) : null),
    },
    shippingAddress: {
      name: { type: String, required: true },
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zipCode: { type: String, required: true },
      country: { type: String, required: true, default: "India" },
      phone: { type: String, required: true },
      email: { type: String }, // Optional email in address
      relationship: { type: String }, // Optional
    },
    // Delivery details now embedded as a subdocument.
    delivery: {
      mode: {
        type: String,
        enum: ["manual", "automatic", "manual+automatic", "automatic+manual"],
        required: true,
        default: "manual",
      },
      cost: {
        type: Number,
        required: true,
        default: 0,
        get: (v) => (v != null ? v.toFixed(2) : null),
        set: (v) => (v != null ? roundToTwo(parseFloat(v)) : null),
      },
      estimatedDeliveryDays: { type: Number, default: 0 },
      shipmentId: { type: String, index: true }, // Delhivery Waybill (AWB)
      trackingInfo: { type: String }, // Can store last status or notes
      labelUrl: { type: String }, // URL for the shipping label PDF
    },
    paymentMethod: {
      // Added to distinguish COD/Prepaid easily
      type: String,
      enum: ["COD", "Prepaid"],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded", "refund_failed"],
      default: "pending",
      required: true,
    },
    orderStatus: {
      type: String,
      enum: [
        "processing", // Order placed, pending confirmation/payment
        "confirmed", // Payment OK/COD Confirmed, ready for packing
        "ready_to_ship", // Packed, ready for Delhivery pickup/manifest
        "shipped", // Handed over to Delhivery, waybill generated
        "out_for_delivery", // On its way to customer today
        "delivered", // Confirmed delivery
        "cancelled", // Order cancelled
        "shipment_failed", // Delhivery API call failed
        "payment_failed", // Payment gateway failure
        "rto", // Return to Origin initiated
        "returned", // Return completed
      ],
      default: "processing",
      required: true,
    },
    // Custom human-friendly order identifier generated after successful payment
    customOrderId: { type: String, unique: true, sparse: true, index: true },
    // Payment gateway details (Example: Razorpay)
    razorpayOrderId: { type: String },
    paymentId: { type: String }, // Stores Razorpay Payment ID or other transaction ID
    razorpaySignature: { type: String },
    // Discount/Coupon Details
    discount: {
      // Total discount amount applied
      type: Number,
      default: 0,
      get: (v) => (v != null ? v.toFixed(2) : null),
      set: (v) => (v != null ? roundToTwo(parseFloat(v)) : null),
    },
    coupon: {
      code: { type: String },
      discountType: { type: String, enum: ["percentage", "fixed"] },
      discountValue: { type: Number },
      discountApplied: {
        // Actual amount discounted by this coupon
        type: Number,
        get: (v) => (v != null ? v.toFixed(2) : null),
        set: (v) => (v != null ? roundToTwo(parseFloat(v)) : null),
      },
    },
    // Refund Details
    refundRequest: {
      reason: String,
      status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
      },
      requestedAt: { type: Date },
    },
    // Status History
    statusHistory: [
      {
        status: { type: String, required: true },
        updatedAt: { type: Date, default: Date.now, required: true },
        remarks: String,
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
      }
    ],
    
    // Delivery Tracking - Comprehensive delivery events and logs
    deliveryTracking: {
      trackingId: { type: String }, // AWB number or other tracking ID
      provider: { type: String }, // Delivery service provider name
      events: [{
        code: { type: String }, // Event code (e.g., "OFD" for Out for Delivery)
        status: { type: String, required: true }, // Human readable status
        timestamp: { type: Date, default: Date.now, required: true },
        location: { type: String }, // Where the event occurred
        description: { type: String }, // Detailed description of the event
        expectedDelivery: { type: Date }, // Expected delivery date if available
        updatedBy: { type: String }, // Who updated this (system, admin, courier)
        meta: { type: Map, of: String } // Additional metadata about the event
      }],
      customerInstructions: { type: String }, // Any delivery instructions
      expectedDeliveryDate: { type: Date }, // Expected delivery date
      actualDeliveryDate: { type: Date }, // Actual delivery date
      deliveryAttempts: { type: Number, default: 0 }, // Number of delivery attempts
      signature: { type: String }, // URL to delivery signature image if available
      proofOfDelivery: { type: String }, // URL to proof of delivery document
      lastMileStatus: { type: String }, // Last mile delivery status
      receivedBy: { type: String }, // Name of person who received the package
    },
  },
  { timestamps: true, toJSON: { getters: true }, toObject: { getters: true } } // Enable getters for output
);

// Indexing for common queries
orderSchema.index({ user: 1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ "delivery.shipmentId": 1 }, { unique: true, sparse: true }); // Ensure waybills are unique if present

module.exports = mongoose.model("Order", orderSchema);
