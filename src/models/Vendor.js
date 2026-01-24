const mongoose = require("mongoose");

const vendorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // Vendor/Company Name (Required for Delhivery)
    email: { type: String, required: false, unique: false, sparse: true },
    address: { type: String, required: true }, // Street Address, Locality (Required)
    pincode: { type: String, required: true }, // Pincode (Required)
    city: { type: String, required: true }, // Required by Delhivery
    state: { type: String, required: true }, // Required by Delhivery
    country: { type: String, required: true, default: "India" }, // Required by Delhivery
    contactName: { type: String }, // Contact Person at Pickup
    contactNumber: { type: String, required: true }, // Phone Number (Required by Delhivery)
    notes: { type: String },
    deliverablePincodes: [{ type: String }], // Not directly used for pickup, but for vendor info
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "published",
    },
    // Products array - Defines pricing/costs, not directly used for pickup address
    products: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        vendorPrice: { type: Number, default: 0 },
        vendorTax: { type: Number, default: 0 },
        vendorOtherCost: { type: Number, default: 0 },
      },
    ],
    // Optional: If you register vendors as specific named pickup locations in Delhivery
    delhiveryPickupLocationName: { type: String }, // Legacy/compatible field
    // New fields per requirement
    vendor_delevery_name: { type: String }, // exact warehouse name registered in Delhivery (case-sensitive)
    is_regsterd_dlevery: { type: Boolean, default: false },
    gstin: { type: String }, // Optional: Add GSTIN if needed for shipment payload
    
    // Warehouse registration fields
    warehouse: {
      name: { type: String }, // Format: {vendor_name}_gipza
      status: { 
        type: String, 
        enum: ['pending', 'registered', 'failed', 'retrying'], 
        default: 'pending' 
      },
      retry_count: { type: Number, default: 0 },
      max_retries: { type: Number, default: 3 },
      last_attempt: { type: Date },
      error_message: { type: String },
      delhivery_warehouse_id: { type: String }, // ID returned by Delhivery
      created_at: { type: Date, default: Date.now },
      updated_at: { type: Date, default: Date.now }
    }
  },
  {
    timestamps: true,
  }
);

// Index for faster lookups if needed
vendorSchema.index({ email: 1 });
vendorSchema.index({ name: 1 });

module.exports = mongoose.model("Vendor", vendorSchema);
