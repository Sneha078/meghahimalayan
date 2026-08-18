import mongoose from "mongoose";
import validator from "validator";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please enter your name"],
      trim: true,
      minlength: [3, "Name must be at least 3 characters"],
      maxlength: [50, "Name cannot exceed 50 characters"],
    },

    email: {
      type: String,
      required: [true, "Please enter your email"],
      unique: true,
      trim: true,
      lowercase: true,
      validate: [validator.isEmail, "Please enter a valid email address"],
    },

    password: {
      type: String,
      required: [true, "Please enter a password"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false, // never returned in queries unless explicitly requested
    },

    phone: {
      type: String,
      default: "",
      trim: true,
    },

    // Saved shipping addresses (stored on user for quick checkout)
    addresses: [
      {
        name: { type: String, required: true, trim: true },
        phone: { type: String, required: true, trim: true },
        street: { type: String, required: true, trim: true },
        city: { type: String, required: true, trim: true },
        province: { type: String, required: true, trim: true },
        postalCode: { type: String, required: true, trim: true },
        isDefault: { type: Boolean, default: false },
      },
    ],

    // Wishlist — array of Product references
    wishlist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],

    // Cloudinary avatar
    avatar: {
      public_id: { type: String, default: "" },
      url: { type: String, default: "" },
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    // Password reset
    resetPasswordToken: { type: String, default: null },
    resetPasswordExpire: { type: Date, default: null },
  },
  { timestamps: true }
);

// ── Hash password before every save (only when modified) ──────────────────
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcryptjs.hash(this.password, 12);
  next();
});

// ── Instance methods ──────────────────────────────────────────────────────

// Sign and return a JWT for this user
userSchema.methods.getJWTToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// Bcrypt comparison for login
userSchema.methods.verifyPassword = async function (enteredPassword) {
  return bcryptjs.compare(enteredPassword, this.password);
};

// Generate a plain-text reset token, store its hash on the document,
// and return the plain-text token (sent in the email link).
userSchema.methods.generatePasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // Token valid for 30 minutes
  this.resetPasswordExpire = Date.now() + 30 * 60 * 1000;

  return resetToken;
};

// ── Indexes ───────────────────────────────────────────────────────────────
// NOTE: email already has a unique index from the schema definition above.
// Only add the reset token index here — do not duplicate the email index.
userSchema.index({ resetPasswordToken: 1 }); // fast lookup on password reset

const User = mongoose.model("User", userSchema);
export default User;
