const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const addressSchema = new mongoose.Schema({
  street: { type: String, required: false },
  city: { type: String, required: false },
  state: { type: String, required: false },
  zipCode: { type: String, required: false },
  country: { type: String, required: false },
  phone: { type: String, required: false },
  relationship: { type: String, required: false }, // Optional field for relationship
  name: { type: String, required: false }, // Optional field for contact name
});

const userSchema = new mongoose.Schema(
  {
    phoneNumber: { type: String, required: true, unique: true },
    name: { type: String, required: false },
    email: {
      type: String,
      required: false,
      default: function () {
        return this.phoneNumber + "_no_email";
      },
    },
    password: { type: String, required: false },
    role: {
      type: String,
      enum: ["customer", "admin", "executive", "manager"],
      default: "customer",
    },
    gender: {
      type: String,
      enum: ["male", "female", "non-binary", "prefer not to say"],
      required: false,
    },
    dateOfBirth: {
      type: Date,
      required: false,
    },
    addresses: [addressSchema], // Embedding addressSchema here
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    otp: {
      code: String,
      expiresAt: Date,
    },
    fcmToken: { type: String, required: false },
    refreshToken: { type: String, required: false },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true, // Include virtual fields
      versionKey: false, // Exclude __v field
      transform: (doc, ret) => {
        // Ensure every field is present in the returned object
        Object.keys(doc.schema.paths).forEach((path) => {
          if (!(path in ret)) {
            ret[path] = ret[path] || null;
          }
        });
        return ret;
      },
    },
  }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (this.password && this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
