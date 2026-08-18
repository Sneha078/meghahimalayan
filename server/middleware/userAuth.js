import jwt from "jsonwebtoken";
import HandleError from "../utils/handleError.js";
import handleAsyncError from "./handleAsyncError.js";
import User from "../models/userModel.js";

// ── verifyUserAuth ───────────────────────────────────────────────────────────
// Reads the JWT from the httpOnly cookie, verifies it, and attaches the
// full user document to req.user.
//
// IMPORTANT: jwt.verify() throws synchronously (JsonWebTokenError,
// TokenExpiredError). We catch it explicitly so the error reaches the
// centralized error middleware with its correct name — otherwise Express
// would treat it as an unhandled exception and return a generic 500.

export const verifyUserAuth = handleAsyncError(async (req, res, next) => {
  const { token } = req.cookies;

  if (!token) {
    return next(
      new HandleError(
        "Authentication is missing. Please login to access this resource",
        401
      )
    );
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
  } catch (err) {
    // Forward JsonWebTokenError / TokenExpiredError to error middleware
    return next(err);
  }

  const user = await User.findById(decoded.id);

  if (!user) {
    return next(
      new HandleError(
        "The user belonging to this token no longer exists",
        401
      )
    );
  }

  req.user = user;
  next();
});

// ── roleBasedAccess ──────────────────────────────────────────────────────────
// Must be used AFTER verifyUserAuth (req.user must already be set).
// Usage: roleBasedAccess("admin") or roleBasedAccess("admin", "superadmin")

export const roleBasedAccess = (...roles) => {
  return (req, res, next) => {
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
