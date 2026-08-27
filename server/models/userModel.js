import mongoose from "mongoose";
import validator from "validator";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

//Address schema
const addressSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Address name is required"],
      trim: true,
      minlength: [2, "Address name must be at least 2 characters"],
      maxlength: [50, "Address name cannot exceed 50 characters"],
    },

    phone: {
      type: String,
      required: [true, "Address phone number is required"],
      trim: true,
      match: [/^(?:\+977)?9[678]\d{8}$/, "Please enter a valid Nepal phone number"],
    },

    street: {
      type: String,
      required: [true, "Street address is required"],
      trim: true,
      maxlength: [200, "Street address cannot exceed 200 characters"],
    },

    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
      maxlength: [100, "City cannot exceed 100 characters"],
    },

    province: {
      type: String,
      required: [true, "Province is required"],
      trim: true,
      maxlength: [100, "Province cannot exceed 100 characters"],
    },

    postalCode: {
      type: String,
      required: [true, "Postal code is required"],
      trim: true,
      maxlength: [20, "Postal code cannot exceed 20 characters"],
    },

    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    _id: true,
  }
);

// User schema
const userSchema = new mongoose.Schema(
  {
  
    // BASIC INFORMATION
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
      maxlength: [100, "Email cannot exceed 100 characters"],
    },

    phone: {
      type: String,
      default: "",
      trim: true,
      match: [
        /^(?:\+977)?9[678]\d{8}$/,
        "Please enter a valid Nepal phone number",
      ],
    },

    // PASSWORD
    password: {
      type: String,
      required: [true, "Please enter a password"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false,
    },

    passwordChangedAt: {
      type: Date,
      default: null,
    },

    // ACCOUNT STATUS

    isActive: {
      type: Boolean,
      default: true,
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    deletedAt: {
      type: Date,
      default: null,
    },

    lastLogin: {
      type: Date,
      default: null,
    },

    // ROLE
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
      index: true,
    },

    // ADDRESSES
    addresses: {
      type: [addressSchema],
      default: [],
    },

    // WISHLIST
    wishlist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],

    // AVATAR
    avatar: {
      public_id: {
        type: String,
        default: "",
      },

      url: {
        type: String,
        default: "",
      },
    },

    // PASSWORD RESET
    resetPasswordToken: {
      type: String,
      default: null,
      select: false,
    },

    resetPasswordExpire: {
      type: Date,
      default: null,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

// PASSWORD HASHING

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }

  this.password = await bcryptjs.hash(this.password, 12);

  // Prevent passwordChangedAt from being set incorrectly
  if (!this.isNew) {
    this.passwordChangedAt = new Date(Date.now() - 1000);
  }

  next();
});

// JWT
userSchema.methods.getJWTToken = function () {
  return jwt.sign(
    {
      id: this._id,
    },
    process.env.JWT_SECRET_KEY,
    {
      expiresIn: process.env.JWT_EXPIRE || "7d",
    }
  );
};

// PASSWORD VERIFICATION
userSchema.methods.verifyPassword = async function (enteredPassword) {
  return bcryptjs.compare(enteredPassword, this.password);
};

// JWT INVALIDATION AFTER PASSWORD CHANGE
userSchema.methods.isPasswordChangedAfter = function (jwtIssuedAt) {
  if (!this.passwordChangedAt) {
    return false;
  }

  const changedTimestamp = parseInt(
    this.passwordChangedAt.getTime() / 1000,
    10
  );

  return jwtIssuedAt < changedTimestamp;
};

// PASSWORD RESET TOKEN
userSchema.methods.generatePasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.resetPasswordExpire = new Date(
    Date.now() + 30 * 60 * 1000
  );

  return resetToken;
};

// INDEXES
userSchema.index({ resetPasswordToken: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ createdAt: -1 });
const User = mongoose.model("User", userSchema);

export default User;