import mongoose from "mongoose";

const contactSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please enter your name"],
      trim: true,
    },

    email: {
      type: String,
      required: [true, "Please enter your email"],
      trim: true,
      lowercase: true,
    },

    phone: { type: String, default: "", trim: true },

    subject: {
      type: String,
      required: [true, "Please select a subject"],
      enum: [
        "Product Inquiry",
        "Return & Refund",
        "Prescription Eyewear",
        "Wholesale / Bulk Order",
        "Other",
      ],
    },

    message: {
      type: String,
      required: [true, "Please enter your message"],
      trim: true,
    },

    status: {
      type: String,
      enum: ["New", "Read", "Replied", "Closed"],
      default: "New",
    },

    // Optional link to a registered user
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

contactSchema.index({ status: 1, createdAt: -1 });

const ContactMessage = mongoose.model("ContactMessage", contactSchema);
export default ContactMessage;
