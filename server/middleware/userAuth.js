import jwt from "jsonwebtoken";
import HandleError from "../utils/handleError.js";
import handleAsyncError from "./handleAsyncError.js";
import User from "../models/userModel.js";

// ─────────────────────────────────────────────────────────────────────────────
// VERIFY USER AUTHENTICATION
// ─────────────────────────────────────────────────────────────────────────────
// Reads JWT from httpOnly cookie
// Verifies JWT
// Finds user in MongoDB
// Checks account status
// Checks password-change invalidation
// Attaches user to req.user
//
// Works for:
//   1. Email/password users
//   2. Google users
// ─────────────────────────────────────────────────────────────────────────────

export const verifyUserAuth = handleAsyncError(async (req, res, next) => {
  // ───────────────────────────────────────────────────────────
  // 1. Get JWT from httpOnly cookie
  // ───────────────────────────────────────────────────────────
  const { token } = req.cookies;

  if (!token) {
    return next(
      new HandleError(
        "Authentication is missing. Please login to access this resource",
        401
      )
    );
  }

  // ───────────────────────────────────────────────────────────
  // 2. Verify JWT
  // ───────────────────────────────────────────────────────────
  let decoded;

  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
  } catch (err) {
    return next(err);
  }

  // ───────────────────────────────────────────────────────────
  // 3. Find user
  // ───────────────────────────────────────────────────────────
  const user = await User.findById(decoded.id);

  if (!user) {
    return next(
      new HandleError(
        "The user belonging to this token no longer exists",
        401
      )
    );
  }

  // ───────────────────────────────────────────────────────────
  // 4. Check account status
  // ───────────────────────────────────────────────────────────
  if (user.isDeleted) {
    return next(new HandleError("This account has been deleted", 401));
  }

  if (!user.isActive) {
    return next(new HandleError("This account is inactive", 401));
  }

  // ───────────────────────────────────────────────────────────
  // 5. Check password change
  // ───────────────────────────────────────────────────────────
  // For normal users: passwordChangedAt can invalidate old JWTs.
  // For Google users: passwordChangedAt is null, returning false.
  // ───────────────────────────────────────────────────────────
  if (user.isPasswordChangedAfter(decoded.iat)) {
    return next(
      new HandleError(
        "Password was recently changed. Please login again",
        401
      )
    );
  }

  // ───────────────────────────────────────────────────────────
  // 6. Attach user to request
  // ───────────────────────────────────────────────────────────
  req.user = user;

  next();
});

// ─────────────────────────────────────────────────────────────────────────────
// ROLE BASED ACCESS
// ─────────────────────────────────────────────────────────────────────────────
export const roleBasedAccess = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new HandleError("Authentication is required", 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new HandleError(
          `Role '${req.user.role}' is not permitted to access this resource`,
          403
        )
      );
    }

    next();
  };
};