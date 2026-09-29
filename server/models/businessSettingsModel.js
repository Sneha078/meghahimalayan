import mongoose from "mongoose";
import validator from "validator";

const businessSettingsSchema = new mongoose.Schema(
  {
    // Contact Information
    phone: {
      type: String,
      required: [true, "Business phone number is required"],
      trim: true,
      validate: {
        validator: function (v) {
          return /^(?:\+977)?9[678]\d{8}$/.test(v);
        },
        message: "Please enter a valid Nepal phone number",
      },
    },

    whatsapp: {
      type: String,
      required: [true, "WhatsApp number is required"],
      trim: true,
      validate: {
        validator: function (v) {
          return /^(?:\+977)?9[678]\d{8}$/.test(v);
        },
        message: "Please enter a valid Nepal WhatsApp number",
      },
    },

    email: {
      type: String,
      required: [true, "Business email is required"],
      trim: true,
      lowercase: true,
      validate: [validator.isEmail, "Please enter a valid email address"],
    },

    // Address Information
    address: {
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
      postalCode: {
        type: String,
        required: [true, "Postal code is required"],
        trim: true,
        maxlength: [20, "Postal code cannot exceed 20 characters"],
      },
      country: {
        type: String,
        required: [true, "Country is required"],
        trim: true,
        default: "Nepal",
        maxlength: [100, "Country cannot exceed 100 characters"],
      },
    },

    // Business Hours
    openingHours: {
      weekdays: {
        type: String,
        required: [true, "Weekday hours are required"],
        trim: true,
        default: "Sun–Fri: 10:00 AM – 6:00 PM",
      },
      saturday: {
        type: String,
        trim: true,
        default: "Closed",
      },
    },

    // Company Information
    companyName: {
      type: String,
      required: [true, "Company name is required"],
      trim: true,
      default: "Mega Himalaya",
      maxlength: [100, "Company name cannot exceed 100 characters"],
    },

    tagline: {
      type: String,
      trim: true,
      default: "Optical House",
      maxlength: [200, "Tagline cannot exceed 200 characters"],
    },

    description: {
      type: String,
      trim: true,
      default: "Pokhara's premier destination for international eyewear, watches and fragrances founded by Mr. Suraj Singh in 2001.",
      maxlength: [500, "Description cannot exceed 500 characters"],
    },

    // Social Media
    socialMedia: {
      facebook: {
        type: String,
        trim: true,
        default: "",
      },
      instagram: {
        type: String,
        trim: true,
        default: "",
      },
      tiktok: {
        type: String,
        trim: true,
        default: "",
      },
    },

    // Last updated by
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Only allow one business settings record
businessSettingsSchema.index({ _id: 1 }, { unique: true });

const BusinessSettings = mongoose.model("BusinessSettings", businessSettingsSchema);

export default BusinessSettings;