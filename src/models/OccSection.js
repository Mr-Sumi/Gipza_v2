const mongoose = require("mongoose");

const OccSectionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    description: {
      type: String,
      required: false,
      default: "",
      trim: true,
    },
    image: {
      type: String,
      required: false,
      default:
        "https://th.bing.com/th/id/OIP.J2Ii3CuiN8Hg43HWTSYDRAHaHa?rs=1&pid=ImgDetMain",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("OccSection", OccSectionSchema);

