import mongoose from "mongoose";
import validator from "validator"; // Email validation
import bcryptjs from "bcryptjs"; // Password hashing
import jwt from "jsonwebtoken"; // JWT token generation
import crypto from "crypto"; // Password reset token generation

const userSchema = new mongoose.Schema(
  {
    // User's name
    name: {
      type: String,
      required: [true, "Please enter your name"],
      trim: true,
      minlength: [3, "Name must be at least 3 characters"],
      maxlength: [50, "Name cannot exceed 50 characters"],
    },

    // User's email address
    email: {
      type: String,
      required: [true, "Please enter your email"],
      unique: true,
      trim: true,
      lowercase: true,
      validate: [validator.isEmail, "Please enter a valid email address"],
    },

    // User's password
    password: {
      type: String,
      required: [true, "Please enter a password"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false, // Do not return password in normal queries
    },

    // User's phone number
    phone: {
      type: String,
      default: "",
      trim: true,
    },

    // Store multiple shipping addresses
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

    // Store product IDs added to the user's wishlist
    wishlist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],

    // User's profile picture stored in Cloudinary
    avatar: {
      public_id: { type: String, default: "" },
      url: { type: String, default: "" },
    },

    // Role-based authorization
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    // Password reset information
    resetPasswordToken: {
      type: String,
      default: null,
    },
    resetPasswordExpire: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Hash the password before saving the user
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcryptjs.hash(this.password, 12);
  next();
});

// Generate JWT token after successful login
userSchema.methods.getJWTToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// Compare entered password with the hashed password in the database
userSchema.methods.verifyPassword = async function (enteredPassword) {
  return bcryptjs.compare(enteredPassword, this.password);
};

// Generate a secure reset token for forgot-password functionality
userSchema.methods.generatePasswordResetToken = function () {
  // Generate a random reset token
  const resetToken = crypto.randomBytes(32).toString("hex");

  // Hash the reset token before storing it in the database
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // Set reset token expiry to 30 minutes
  this.resetPasswordExpire = Date.now() + 30 * 60 * 1000;

  // Return the plain token to send in the email
  return resetToken;
};

// Create an index for faster password-reset token lookup
userSchema.index({ resetPasswordToken: 1 });

// Create the User model from the schema
const User = mongoose.model("User", userSchema);

export default User;