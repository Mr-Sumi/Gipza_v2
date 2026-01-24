const mongoose = require("mongoose");

const ListSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "List name is required"],
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    type: {
      type: String,
      required: [true, "List type is required"],
      enum: ["vendor", "pincode", "category", "tag", "pricing"],
      index: true
    },
    content: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, "List content is required"]
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("List", ListSchema); 