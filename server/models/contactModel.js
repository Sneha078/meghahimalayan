import mongoose from "mongoose";

const contactSchema = new mongoose.Schema(
 {
  name: {
    type: String,
    required: [true, "Please enter your name"],
    trim: true,
  },

  //customer email is required
  email: {
    type: String,
    required: [true, "Please enter your email"],
    trim: true,
    lowercase: true,
  },

  //contact no is optional
  phone: {
    type: String,
    default: "",
    trim: true,
  },

  //define main category for a message
  subject: {
    type: String,
    required: [true, "Please select a subject"],
    enum: [
      "Product Inquiry",
      "Return & Refund",
      "Prescription Eyewear",
      "Wholesale / Bulk Order",
      "Other"
    ],
  },

  //store customer actual message
  message: {
    type: String,
    required: [true, "Please enter your message"],
    trim: true,
  },

  //tracks message current status from admin side 
  status: {
    type: String,
    enum: ["New", "Read", "Replied", "Closed"],
    default: "New",
  },

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
 },
 {
  timestamps: true
 }
 );
 contactSchema.index({
  status: 1,
  createdAt: -1
 });

 const ContactMessage = mongoose.model("ContactMessage", contactSchema);
 export default ContactMessage;