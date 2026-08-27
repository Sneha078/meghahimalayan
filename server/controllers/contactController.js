import ContactMessage from "../models/contactModel.js";
import HandleError from "../utils/handleError.js";
import handleAsyncError from "../middleware/handleAsyncError.js";


// PUBLIC API 
// POST /api/v1/contact
// Open to everyone — guests and logged-in users 
export const createContactMessage = handleAsyncError(async (req, res, next) => {
  const { name, email, phone, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    return next(
      new HandleError("Name, email, subject and message are required", 400)
    );
  }

  const contact = await ContactMessage.create({
    name,
    email,
    phone: phone || "",
    subject,
    message,
    // Link to the authenticated user if they are logged in
    user: req.user ? req.user._id : null,
  });

  res.status(201).json({
    success: true,
    message: "Your message has been sent. We will get back to you within 24 hours.",
    contact,
  });
});


// ADMIN API 
// GET /api/v1/admin/messages
export const getAllContactMessages = handleAsyncError(async (req, res, next) => {
  // Optional filter by status: ?status=New
  const filter = {};
  if (req.query.status) {
    const valid = ["New", "Read", "Replied", "Closed"];
    if (!valid.includes(req.query.status)) {
      return next(new HandleError(`Invalid status filter. Use: ${valid.join(", ")}`, 400));
    }
    filter.status = req.query.status;
  }

  const messages = await ContactMessage.find(filter)
    .populate("user", "name email")
    .sort("-createdAt");

  res.status(200).json({ success: true, count: messages.length, messages });
});

// PUT /api/v1/admin/message/:id
export const updateContactStatus = handleAsyncError(async (req, res, next) => {
  const { status } = req.body;

  const valid = ["New", "Read", "Replied", "Closed"];
  if (!status || !valid.includes(status)) {
    return next(new HandleError(`Status must be one of: ${valid.join(", ")}`, 400));
  }

  const message = await ContactMessage.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true, runValidators: true }
  );

  if (!message) {
    return next(new HandleError("Message not found", 404));
  }

  res.status(200).json({
    success: true,
    message: "Message status updated",
    contact: message,
  });
});

// DELETE /api/v1/admin/message/:id
export const deleteContactMessage = handleAsyncError(async (req, res, next) => {
  const message = await ContactMessage.findByIdAndDelete(req.params.id);

  if (!message) {
    return next(new HandleError("Message not found", 404));
  }

  res.status(200).json({ success: true, message: "Message deleted successfully" });
});
