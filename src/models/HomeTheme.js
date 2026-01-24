const mongoose = require("mongoose");

const tabSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  products: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product"
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, { _id: false });

const sectionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  color: {
    type: String,
    default: "#000000"
  },
  products: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product"
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, { _id: false });

const homeThemeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  banners: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Banner"
  }],
  tabs: [tabSchema],
  sections: [sectionSchema],
  pincodes: [{
    type: String,
    trim: true
  }],
  status: {
    type: String,
    enum: ["draft", "published"],
    default: "draft"
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  priority: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for faster pincode queries
homeThemeSchema.index({ pincodes: 1 });
homeThemeSchema.index({ isDefault: 1 });
homeThemeSchema.index({ createdAt: -1 });

// Ensure only one default theme exists
homeThemeSchema.pre('save', async function(next) {
  if (this.isDefault && this.isNew) {
    // If this is a new default theme, make all other themes non-default
    await this.constructor.updateMany(
      { _id: { $ne: this._id } },
      { isDefault: false }
    );
  }
  next();
});

const HomeTheme = mongoose.model("HomeTheme", homeThemeSchema);

module.exports = HomeTheme; 