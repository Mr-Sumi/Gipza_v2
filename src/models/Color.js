const mongoose = require("mongoose");

const ColorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    hex: { type: String, required: true, default: "#FFFFFF" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Color", ColorSchema);
