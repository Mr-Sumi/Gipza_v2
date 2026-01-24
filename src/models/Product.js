const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    rating: {
      type: String,
      enum: ["1.0", "2.0", "3.0", "4.0", "5.0"],
      required: true,
    },
    comment: { type: String },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

function roundToTwo(num) {
  if (num == null || isNaN(num)) return null;
  return Math.round(num * 100) / 100;
}

const productSchema = new mongoose.Schema(
  {
    // Basic Details
    name: { type: String, required: true },
    description: { type: String },
    sku: { type: String, required: true, unique: true },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
    },
    isActive: { type: Boolean, default: true },
    isVisible: { type: Boolean, default: true },

    // Price Information
    sellingPrice: {
      type: Number,
      required: true,
      get: (v) => (v != null ? v.toFixed(2) : null),
      set: (v) => (v != null ? roundToTwo(parseFloat(v)) : null),
    },
    comparePrice: {
      type: Number,
      get: (v) => (v != null ? v.toFixed(2) : null),
      set: (v) => (v != null ? roundToTwo(parseFloat(v)) : null),
    },

    // Vendor Information - Corrected Reference
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor", // Reference the Vendor model
      required: true, // Vendor is mandatory for dynamic pickup
    },
    vendorName: { type: String }, // Can be auto-populated or kept for display
    purchaseCost: { type: Number },
    tax: { type: Number },
    otherCost: { type: Number },
    totalCost: { type: Number },

    // Product Classification
    category: [{ type: String }],
    tags: [String],
    productTags: [String],
    colors: [String],
    occasion: [String],
    sizes: [String],
    gender: [{
      type: String,
      enum: ["Male", "Female", "Unisex"],
    }],

    // Media
    thumbnail: { type: String },
    images: [String],
    videos: [{
      url: { type: String, required: true },
      key: { type: String, required: true }, // S3 key for deletion
      title: { type: String },
      description: { type: String },
      duration: { type: Number }, // Duration in seconds
      size: { type: Number }, // File size in bytes
      uploadedAt: { type: Date, default: Date.now },
    }],

    // Stock Information
    stock: { type: Number, default: 0 },
    saleCount: { type: Number, default: 0 },

    // Combo Products and Related/Addon Products
    isCombo: { type: Boolean, default: false },
    relatedProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    addOnProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],

    // Dimensions and Physical Properties
    materialType: { type: String },
    weight: {
      // Weight in KG
      type: Number,
      get: (v) => (v != null ? v.toFixed(2) : null),
      set: (v) => (v != null ? roundToTwo(parseFloat(v)) : null),
    },
    width: {
      // Dimensions in CM
      type: Number,
      get: (v) => (v != null ? v.toFixed(2) : null),
      set: (v) => (v != null ? roundToTwo(parseFloat(v)) : null),
    },
    height: {
      // Dimensions in CM
      type: Number,
      get: (v) => (v != null ? v.toFixed(2) : null),
      set: (v) => (v != null ? roundToTwo(parseFloat(v)) : null),
    },
    length: {
      // Dimensions in CM
      type: Number,
      get: (v) => (v != null ? v.toFixed(2) : null),
      set: (v) => (v != null ? roundToTwo(parseFloat(v)) : null),
    },
    hsnCode: { type: String },

    // Rich Text Content
    highlights: { type: String }, // Stored as JSON string or HTML string
    moreInfo: { type: String }, 
    deliveryMode: {
      type: String,
      enum: ["manual", "automatic", "automatic+manual", "manual+automatic"],
      default: "manual", // Default to manual delivery
    },

    // Delivery Information
    deliverablePincodes: [{ 
      code: { type: String },
      area: { type: String },
      city: { type: String }
    }],
    
    distanceBasedDelivery: {
      enabled: { type: Boolean, default: false },
      ranges: [{
        minDistance: { type: Number },
        maxDistance: { type: Number },
        price: { type: Number },
        deliveryTime: { type: String }
      }]
    },

    metaTitle: { type: String },
    metaDescription: { type: String },
    keywords: [String],

    // Customization
    isCustomizable: { type: Boolean, default: false },

    // Reviews
    reviews: [reviewSchema],
    isInWishlist: { type: Boolean, default: false }, // Consider managing this separately
  },
  {
    timestamps: true,
    toJSON: { getters: true, virtuals: true },
    toObject: { getters: true, virtuals: true },
  }
);

// Virtual for calculating the average rating.
productSchema.virtual("averageRating").get(function () {
  if (!this.reviews || this.reviews.length === 0) return "0.0";
  const validReviews = this.reviews.filter((review) => review.rating != null);
  const total = validReviews.reduce(
    (sum, review) => sum + parseFloat(review.rating),
    0
  );
  return validReviews.length > 0
    ? (total / validReviews.length).toFixed(1)
    : "0.0";
});

// Virtual for total number of ratings.
productSchema.virtual("totalRatings").get(function () {
  return this.reviews
    ? this.reviews.filter((review) => review.rating != null).length
    : 0;
});

// Create a text index for search functionality
productSchema.index(
  { 
    name: 'text', 
    description: 'text',
    sku: 'text',
    materialType: 'text',
    metaTitle: 'text',
    metaDescription: 'text',
    keywords: 'text',
    tags: 'text',
    productTags: 'text'
  },
  {
    weights: {
      name: 10,
      sku: 8,
      description: 5,
      tags: 3,
      productTags: 3,
      keywords: 2
    },
    name: "product_search_index"
  }
);

module.exports = mongoose.model("Product", productSchema);
