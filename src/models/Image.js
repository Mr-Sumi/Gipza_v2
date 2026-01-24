const mongoose = require("mongoose");

const imageSchema = new mongoose.Schema({
  type: { type: String, required: true }, // e.g. "product", "banner", etc.
  url: { type: String, required: true },
  public_id: { type: String, required: true },
  // Optionally, add a reference field (for example, a product or banner ID)
  // refId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Image", imageSchema);
