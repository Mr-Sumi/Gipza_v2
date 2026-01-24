const mongoose = require("mongoose");

const CategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    image: {
      type: String,
      default:
        "https://th.bing.com/th/id/OIP.J2Ii3CuiN8Hg43HWTSYDRAHaHa?rs=1&pid=ImgDetMain",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Category", CategorySchema);
