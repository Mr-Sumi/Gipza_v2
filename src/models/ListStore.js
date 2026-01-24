const mongoose = require("mongoose");

const ListStoreSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    type: { 
      type: String, 
      required: true,
      enum: [
        "vendor", "pincode", "category", "tag", "productTag", "size", "color", "occasion",
        "theme_banner", "theme_tabs", "theme_sections", "theme_pincode"
      ]
    },
    content: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    createdBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User" 
    }
  },
  { timestamps: true }
);

// Create a compound index on type and name to ensure unique list names within each type
ListStoreSchema.index({ type: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("ListStore", ListStoreSchema);
