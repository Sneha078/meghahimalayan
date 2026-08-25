import crypto from "crypto";
import User from "../models/userModel.js";
import Product from "../models/productModel.js";
import HandleError from "../utils/handleError.js";
import handleAsyncError from "../middleware/handleAsyncError.js";
import { sendToken } from "../utils/jwtToken.js";
import sendEmail from "../utils/sendEmail.js";
import cloudinary from "../config/cloudinary.js";

// Authentication

//Register user
// POST /api/v1/register
export const registerUser = handleAsyncError(async (req, res, next) => {
  const { name, email, password, phone } = req.body;

  if (!name || !email || !password) {
    return next(new HandleError("Name, email and password are required", 400));
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new HandleError("An account with this email already exists", 400));
  }

  const user = await User.create({
    name,
    email,
    password,
    phone: phone || "",
  });

  sendToken(user, 201, res);
});

//Login
// POST /api/v1/login
export const loginUser = handleAsyncError(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new HandleError("Email and password are required", 400));
  }

  // Support login with email OR phone number
  const user = await User.findOne({
    $or: [{ email }, { phone: email }],
  }).select("+password");

  if (!user) {
    return next(new HandleError("Invalid credentials", 401));
  }

  const isMatch = await user.verifyPassword(password);
  if (!isMatch) {
    return next(new HandleError("Invalid credentials", 401));
  }

  sendToken(user, 200, res);
});

//Logout
// POST /api/v1/logout
export const logout = handleAsyncError(async (req, res, next) => {
  res.cookie("token", "", {
    expires: new Date(0),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  res.status(200).json({ success: true, message: "Logged out successfully" });
});

// PASSWORD RESET FLOW
//Forgot password
// POST /api/v1/password/forgot
export const forgotPassword = handleAsyncError(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new HandleError("Please provide your email address", 400));
  }

  const user = await User.findOne({ email });
  if (!user) {
    // Return success even when email not found — prevents user enumeration
    return res.status(200).json({
      success: true,
      message: "If an account with that email exists, a reset link has been sent",
    });
  }

  const resetToken = user.generatePasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // Link goes to the frontend reset page which calls PUT /api/v1/password/reset/:token
  const resetURL = `${process.env.FRONTEND_URL}/password/reset/${resetToken}`;

  const message = `You requested a password reset for your Mega Himalaya account.\n\nClick the link below to reset your password:\n\n${resetURL}\n\nThis link expires in 30 minutes.\n\nIf you did not request this, please ignore this email.`;

  try {
    await sendEmail({
      email: user.email,
      subject: "Mega Himalaya — Password Reset Request",
      message,
    });

    res.status(200).json({
      success: true,
      message: `Password reset link sent to ${user.email}`,
    });
  } catch (err) {
    // Roll back token fields if email failed so user can try again
    user.resetPasswordToken = null;
    user.resetPasswordExpire = null;
    await user.save({ validateBeforeSave: false });

    return next(new HandleError("Email could not be sent. Please try again later", 500));
  }
});

//Reset password
// PUT /api/v1/password/reset/:token
export const resetPassword = handleAsyncError(async (req, res, next) => {
  // Hash the URL token to compare with the stored hash
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return next(new HandleError("Reset token is invalid or has expired", 400));
  }

  const { password, confirmPassword } = req.body;

  if (!password || !confirmPassword) {
    return next(new HandleError("Password and confirm password are required", 400));
  }

  if (password !== confirmPassword) {
    return next(new HandleError("Passwords do not match", 400));
  }

  user.password = password;
  user.resetPasswordToken = null;
  user.resetPasswordExpire = null;
  await user.save();

  sendToken(user, 200, res);
});


// GET CURRENT USER
// GET /api/v1/me
export const getUserDetails = handleAsyncError(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    return next(new HandleError("User not found", 404));
  }

  res.status(200).json({ success: true, user });
});

//Update password
// PUT /api/v1/password/update
export const updatePassword = handleAsyncError(async (req, res, next) => {
  const { oldPassword, newPassword, confirmPassword } = req.body;

  if (!oldPassword || !newPassword || !confirmPassword) {
    return next(
      new HandleError("Old password, new password and confirm password are required", 400)
    );
  }

  const user = await User.findById(req.user.id).select("+password");
  if (!user) {
    return next(new HandleError("User not found", 404));
  }

  const isMatch = await user.verifyPassword(oldPassword);
  if (!isMatch) {
    return next(new HandleError("Current password is incorrect", 400));
  }

  if (newPassword !== confirmPassword) {
    return next(new HandleError("New passwords do not match", 400));
  }

  user.password = newPassword;
  await user.save();

  sendToken(user, 200, res);
});

//Update Profile
// PUT /api/v1/me/update
export const updateProfile = handleAsyncError(async (req, res, next) => {
  const { name, email, phone, avatar } = req.body;

  const user = await User.findById(req.user.id);
  if (!user) {
    return next(new HandleError("User not found", 404));
  }

  if (name !== undefined)  user.name  = name;
  if (phone !== undefined) user.phone = phone;

  if (email !== undefined && email !== user.email) {
    const taken = await User.findOne({ email, _id: { $ne: user._id } });
    if (taken) {
      return next(new HandleError("This email is already in use", 400));
    }
    user.email = email;
  }

  // Avatar upload — expects a base64 data URI string
  if (avatar && avatar.startsWith("data:")) {
    // Delete old avatar from Cloudinary if one exists
    if (user.avatar?.public_id) {
      await cloudinary.uploader.destroy(user.avatar.public_id);
    }

    const result = await cloudinary.uploader.upload(avatar, {
      folder: "avatars",
      width: 200,
      crop: "scale",
    });

    user.avatar = { public_id: result.public_id, url: result.secure_url };
  }

  await user.save();

  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    user,
  });
});


// ADDRESSES
// POST /api/v1/addresses
export const addAddress = handleAsyncError(async (req, res, next) => {
  const { name, phone, street, city, province, postalCode, isDefault } = req.body;

  if (!name || !phone || !street || !city || !province || !postalCode) {
    return next(
      new HandleError("Name, phone, street, city, province and postal code are required", 400)
    );
  }

  const user = await User.findById(req.user.id);
  if (!user) {
    return next(new HandleError("User not found", 404));
  }

  // First address is always the default
  const makeDefault = isDefault || user.addresses.length === 0;

  if (makeDefault) {
    user.addresses.forEach((a) => (a.isDefault = false));
  }

  user.addresses.push({ name, phone, street, city, province, postalCode, isDefault: makeDefault });
  await user.save();

  res.status(201).json({
    success: true,
    message: "Address added successfully",
    addresses: user.addresses,
  });
});

//Update address
// PUT /api/v1/address/:addressId
export const updateAddress = handleAsyncError(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    return next(new HandleError("User not found", 404));
  }

  const address = user.addresses.id(req.params.addressId);
  if (!address) {
    return next(new HandleError("Address not found", 404));
  }

  const fields = ["name", "phone", "street", "city", "province", "postalCode", "isDefault"];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) address[f] = req.body[f];
  });

  // If this address is being set as default, unset all others
  if (req.body.isDefault === true) {
    user.addresses.forEach((a) => {
      a.isDefault = a._id.toString() === req.params.addressId;
    });
  }

  await user.save();

  res.status(200).json({
    success: true,
    message: "Address updated successfully",
    addresses: user.addresses,
  });
});

//Delete address
// DELETE /api/v1/address/:addressId
export const deleteAddress = handleAsyncError(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    return next(new HandleError("User not found", 404));
  }

  const address = user.addresses.id(req.params.addressId);
  if (!address) {
    return next(new HandleError("Address not found", 404));
  }

  const wasDefault = address.isDefault;
  address.deleteOne();

  // If the deleted address was the default, promote the next one
  if (wasDefault && user.addresses.length > 0) {
    user.addresses[0].isDefault = true;
  }

  await user.save();

  res.status(200).json({
    success: true,
    message: "Address deleted successfully",
    addresses: user.addresses,
  });
});

// WISHLIST
// GET /api/v1/wishlist
export const getWishlist = handleAsyncError(async (req, res, next) => {
  const user = await User.findById(req.user.id).populate(
    "wishlist",
    "name brand price discountPrice image ratings slug"
  );

  res.status(200).json({ success: true, wishlist: user.wishlist });
});

//Add to wishlist
// POST /api/v1/wishlist
export const addToWishlist = handleAsyncError(async (req, res, next) => {
  const { productId } = req.body;

  if (!productId) {
    return next(new HandleError("Product ID is required", 400));
  }

  // Accept both Mongo ObjectId and slug
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(productId);
  const product = isObjectId
    ? await Product.findById(productId)
    : await Product.findOne({ slug: productId });

  if (!product) {
    return next(new HandleError("Product not found", 404));
  }

  const user = await User.findById(req.user.id);

  const alreadyAdded = user.wishlist.some(
    (id) => id.toString() === product._id.toString()
  );
  if (alreadyAdded) {
    return next(new HandleError("Product is already in your wishlist", 400));
  }

  user.wishlist.push(product._id);
  await user.save();

  const updated = await User.findById(req.user.id).populate(
    "wishlist",
    "name brand price discountPrice image ratings slug"
  );

  res.status(200).json({
    success: true,
    message: "Added to wishlist",
    wishlist: updated.wishlist,
  });
});

//Delete wishlist
// DELETE /api/v1/wishlist/:productId
export const removeFromWishlist = handleAsyncError(async (req, res, next) => {
  const { productId } = req.params;

  const isObjectId = /^[0-9a-fA-F]{24}$/.test(productId);
  const product = isObjectId
    ? await Product.findById(productId)
    : await Product.findOne({ slug: productId });

  if (!product) {
    return next(new HandleError("Product not found", 404));
  }

  const user = await User.findById(req.user.id);

  user.wishlist = user.wishlist.filter(
    (id) => id.toString() !== product._id.toString()
  );

  await user.save();

  const updated = await User.findById(req.user.id).populate(
    "wishlist",
    "name brand price discountPrice image ratings slug"
  );

  res.status(200).json({
    success: true,
    message: "Removed from wishlist",
    wishlist: updated.wishlist,
  });
});


// ADMIN — USER MANAGEMENT

// GET /api/v1/admin/users
export const getUsersList = handleAsyncError(async (req, res, next) => {
  const users = await User.find().sort("-createdAt");

  res.status(200).json({ success: true, count: users.length, users });
});

// GET /api/v1/admin/user/:id
export const getSingleUser = handleAsyncError(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new HandleError(`No user found with ID: ${req.params.id}`, 404));
  }

  res.status(200).json({ success: true, user });
});

// PUT /api/v1/admin/user/:id
export const updateUserRole = handleAsyncError(async (req, res, next) => {
  const { role } = req.body;

  if (!role || !["user", "admin"].includes(role)) {
    return next(new HandleError("Role must be either 'user' or 'admin'", 400));
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { role },
    { new: true, runValidators: true }
  );

  if (!user) {
    return next(new HandleError("User not found", 404));
  }

  res.status(200).json({
    success: true,
    message: `User role updated to '${role}'`,
    user,
  });
});

// DELETE /api/v1/admin/user/:id
export const deleteUser = handleAsyncError(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new HandleError("User not found", 404));
  }

  // Clean up Cloudinary avatar
  if (user.avatar?.public_id) {
    await cloudinary.uploader.destroy(user.avatar.public_id);
  }

  await User.findByIdAndDelete(req.params.id);

  res.status(200).json({ success: true, message: "User deleted successfully" });
});
