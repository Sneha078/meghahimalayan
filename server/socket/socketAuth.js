import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

// Socket.IO authentication middleware
//Verify user berfore connection
const socketAuth = async (socket, next) => {
  try {
    // ───────────────────────────────────────────────────
    // 1. Extract token from cookie header (sent automatically
    //    by the browser when withCredentials: true).
    //    httpOnly cookies are NOT accessible via JS / handshake.auth,
    //    but ARE sent in the HTTP upgrade request headers.
    // ───────────────────────────────────────────────────
    const cookieString =
      socket.handshake.headers?.cookie ||
      socket.handshake.auth?.cookie ||
      "";

    const tokenMatch = cookieString.match(/token=([^;]+)/);
    const token = tokenMatch?.[1];

    if (!token) {
      return next(
        new Error("Authentication required. Please log in.")
      );
    }

    // ───────────────────────────────────────────────────
    // 2. Verify JWT validity from secret key
    // ───────────────────────────────────────────────────
    let decoded;

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    } catch {
      return next(
        new Error("Invalid or expired token. Please log in again.")
      );
    }

    // ───────────────────────────────────────────────────
    // 3. Find user
    // ───────────────────────────────────────────────────
    const user = await User.findById(decoded.id);

    if (!user) {
      return next(
        new Error("User not found. Please log in again.")
      );
    }

    // ───────────────────────────────────────────────────
    // 4. Check account status
    // ───────────────────────────────────────────────────
    if (user.isDeleted) {
      return next(new Error("This account has been deleted"));
    }

    if (!user.isActive) {
      return next(new Error("This account is inactive"));
    }

    // ───────────────────────────────────────────────────
    // 5. Check password change invalidation
    // ───────────────────────────────────────────────────
    if (user.isPasswordChangedAfter(decoded.iat)) {
      return next(
        new Error("Password was recently changed. Please log in again.")
      );
    }

    // ───────────────────────────────────────────────────
    // 6. Attach user info to socket
    // ───────────────────────────────────────────────────
    socket.userId = user._id.toString();
    socket.userRole = user.role;
    socket.userName = user.name;

    next();
  } catch (err) {
    console.error("Socket auth error:", err.message);
    next(new Error("Authentication failed"));
  }
};

export default socketAuth;
