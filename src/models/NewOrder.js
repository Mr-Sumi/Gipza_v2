const mongoose = require("mongoose");

// Separate counter collection for per-day sequence numbers
const newOrderCounterSchema = new mongoose.Schema(
  {
    dateKey: { type: String, required: true, unique: true }, // YYYYMMDD
    seq: { type: Number, required: true, default: 0 },
  },
  { versionKey: false }
);

const NewOrderCounter = mongoose.models.NewOrderCounter || mongoose.model("NewOrderCounter", newOrderCounterSchema);

const statusHistorySchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    at: { type: Date, required: true, default: Date.now },
  },
  { _id: false }
);

const trackingSchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    at: { type: Date, required: true, default: Date.now },
    note: { type: String },
  },
  { _id: false }
);

const customizableSchema = new mongoose.Schema(
  {
    caption: { type: String },
    description: { type: String },
    files: [{ type: String }],
  },
  { _id: false }
);

const vendorOrderProductSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    item_cost: { type: Number, required: true },
    isCustomizable: { type: Boolean, default: false },
    customizable: customizableSchema,
    // New fields for individual product cancellation
    status: { type: String, enum: ['active', 'cancelled'], default: 'active' },
    cancelled_at: { type: Date },
    cancel_reason: { type: String },
  },
  { _id: false }
);

const vendorOrderSchema = new mongoose.Schema(
  {
    vendor_id: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor", required: true },
    vendor_name: { type: String },
    sub_order_id: { type: String },
    shipping_method: { type: String, enum: ["manual", "automatic", "automatic+manual", "manual+automatic"], default: "manual" },
    shipping_provider: { type: String },
    shipping_cost: { type: Number, default: 0 },
    waybill_no: { type: String },
    expected_arrival: { type: Date, default: null },
    shipment_retry_count: { type: Number, default: 0 },
    status: { type: String, default: "ready_to_ship" },
    note: { type: String, default: null }, // Field to store shipment failure notes and error details
    tracking: [trackingSchema],
    products: [vendorOrderProductSchema],
  },
  { _id: false }
);

const shippingAddressSchema = new mongoose.Schema(
  {
    street: { type: String },
    city: { type: String },
    state: { type: String },
    zipCode: { type: String },
    country: { type: String },
    phone: { type: String },
    name: { type: String },
    relationship: { type: String },
  },
  { _id: false }
);

const refundInfoSchema = new mongoose.Schema(
  {
    refund_requested: { type: Boolean, default: false },
    refund_status: { type: String, default: "none" },
    refund_amount: { type: Number, default: 0 },
    refund_reason: { type: String },
    refund_processed_at: { type: Date },
    refund_method: { type: String }, // 'original_payment_method', 'bank_transfer', 'wallet'
    refund_reference: { type: String }, // Transaction reference number
  },
  { _id: false }
);

const extraDataSchema = new mongoose.Schema(
  {
    notes: { type: String },
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  { _id: false }
);

const newOrderSchema = new mongoose.Schema(
  {
    order_id: { type: String },
    user_order_id: { type: String, unique: true, index: true },
    user_id: { type: String, required: true },

    amount: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    coupon_code: { type: String, default: null },
    coupon_discount: { type: Number, default: 0 },
    final_order_amount: { type: Number, required: true },
    currency: { type: String, default: "INR" },

    // Razorpay/Payment fields
    rzp_order_id: { type: String },
    rzp_payment_id: { type: String },
    rzp_signature: { type: String },
    rzp_paid_amount: { type: Number, set: (v) => (typeof v === 'number' ? v / 100 : v) },

    payment_method: { type: String, enum: ["prepaid", "cod"], default: "prepaid" },
    payment_status: { type: String, enum: ["pending", "failed", "paid", "refunded"], default: "pending" },
    status: {
      type: String,
      enum: [
        "payment_pending",
        "payment_failed",
        "confirmed",
        "processing",
        "ready_to_ship",
        "shipped",
        "delivered",
        "cancelled",
        "refunded",
        "pending",
      ],
      default: "payment_pending",
      index: true,
    },
    status_history: [statusHistorySchema],

    order_source: { type: String, default: "web" },
    order_channel: { type: String, enum: ["web", "app", "api"], default: "web" },
    order_type: { type: String, default: "normal" },

    vendor_orders: [vendorOrderSchema],
    shipping_address: shippingAddressSchema,

    refund_info: refundInfoSchema,
    extra_data: extraDataSchema,

    order_creation_time: { type: Date },
    confirm_order_time: { type: Date, default: null },
    is_deleted: { type: Boolean, default: false },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

function formatDateYYYYMMDD(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}${mm}${dd}`;
}

function randomAlphaNum2() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return chars[Math.floor(Math.random() * chars.length)] + chars[Math.floor(Math.random() * chars.length)];
}

async function getNextDailySerial(dateKey, session) {
  const update = { $inc: { seq: 1 } };
  const options = { upsert: true, new: true, setDefaultsOnInsert: true };
  const doc = await NewOrderCounter.findOneAndUpdate({ dateKey }, update, { ...options, session });
  return doc.seq;
}

newOrderSchema.pre("validate", async function (next) {
  try {
    const doc = this;
    const now = doc.created_at ? new Date(doc.created_at) : new Date();
    const dateKey = formatDateYYYYMMDD(now);

    if (!doc.order_creation_time) doc.order_creation_time = now;

    if (!doc.user_order_id) {
      // Optional: use a transaction if caller already has one
      let session = null;
      if (typeof doc.$session === "function") {
        session = doc.$session();
      }
      const seq = await getNextDailySerial(dateKey, session);
      const serial4 = String(seq).padStart(4, "0");
      const rand2 = randomAlphaNum2();
      doc.user_order_id = `ODR${dateKey}${rand2}${serial4}`;
    }
    return next();
  } catch (err) {
    return next(err);
  }
});

// Helpful indexes for frequent queries
newOrderSchema.index({ user_id: 1, created_at: -1 });
newOrderSchema.index({ status: 1 });

module.exports = mongoose.models.NewOrder || mongoose.model("NewOrder", newOrderSchema);


