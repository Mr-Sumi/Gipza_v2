const mongoose = require("mongoose");

const pageSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ["terms", "privacy", "about"], // Adjust as needed
    },
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    updatedDate: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Page", pageSchema);
