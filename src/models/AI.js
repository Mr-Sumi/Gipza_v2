// models/Interests.js

const mongoose = require("mongoose");

const interestsSchema = new mongoose.Schema(
  {
    occasion: { type: String },
    gender: { type: String },
    relationship: { type: String },
    nickname: { type: String },
    budget: { type: Number },
    // Each interest slider ranges from -5 to +5
    fashions: { type: Number, default: 0 },
    indoorGames: { type: Number, default: 0 },
    outdoorSports: { type: Number, default: 0 },
    music: { type: Number, default: 0 },
    travels: { type: Number, default: 0 },
    foodie: { type: Number, default: 0 },
    technology: { type: Number, default: 0 },
    luxury: { type: Number, default: 0 },
    creative: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Interests", interestsSchema);
