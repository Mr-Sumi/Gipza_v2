const mongoose = require("mongoose");

const bannerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Banner name is required"],
      trim: true,
    },
    image: {
      type: String,
      required: [true, "Banner image is required"],
    },
    /** S3 object key; used to delete from S3 on update/delete */
    image_key: {
      type: String,
    },
    cloudinary_id: {
      type: String,
    },
    type: {
      type: String,
      required: [true, "Banner type is required"],
      enum: ["banner", "ai-cta"],
      default: "banner",
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const Banner = mongoose.model("Banner", bannerSchema);

module.exports = Banner;
