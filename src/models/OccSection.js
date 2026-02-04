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
    /** S3 object key from POST /upload/image; used to delete from S3 on update/delete */
    image_key: {
      type: String,
      default: null,
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

