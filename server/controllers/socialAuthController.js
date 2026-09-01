import { OAuth2Client } from "google-auth-library";
import User from "../models/userModel.js";
import HandleError from "../utils/handleError.js";
import handleAsyncError from "../middleware/handleAsyncError.js";
import { sendToken } from "../utils/jwtToken.js";

// ─────────────────────────────────────────────────────────────────────────────
// GOOGLE LOGIN
// POST /api/v1/auth/google
//
// How it works:
//   1. User clicks "Sign in with Google" on the frontend
//   2. Frontend receives a Google ID token from @react-oauth/google
//   3. Frontend sends that token to this endpoint
//   4. Backend verifies the token with Google's servers
//   5. Backend finds or creates the user in MongoDB
//   6. Backend issues your own JWT cookie — same as regular login
//
// Body: { idToken: "eyJ..." }
// ─────────────────────────────────────────────────────────────────────────────
export const googleLogin = handleAsyncError(async (req, res, next) => {
  const { idToken } = req.body;

  if (!idToken) {
    return next(new HandleError("Google ID token is required", 400));
  }

  // ── Verify the token with Google ──────────────────────────────────────────
  const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

  let payload;
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch (err) {
    return next(new HandleError("Invalid or expired Google token", 401));
  }

  // ── Extract user info from verified payload ───────────────────────────────
  const { sub: googleId, email, name, picture } = payload;

  if (!email) {
    return next(
      new HandleError("Google account does not have an email address", 400)
    );
  }

  // ── Find or create user ───────────────────────────────────────────────────
  // Priority:
  //   1. Find by googleId (returning Google user)
  //   2. Find by email (user already registered with email — link accounts)
  //   3. Create new user

  let user = await User.findOne({ googleId });

  if (!user) {
    // Check if this email is already registered with email/password
    user = await User.findOne({ email });

    if (user) {
      // Link the Google account to the existing email/password account
      user.googleId = googleId;
      user.authProvider = "google";

      // Update avatar only if the user does not already have one
      if (!user.avatar?.url && picture) {
        user.avatar = { public_id: "", url: picture };
      }

      await user.save({ validateBeforeSave: false });
    } else {
      // Brand new user — create account automatically
      user = await User.create({
        name: name || email.split("@")[0],
        email,
        googleId,
        authProvider: "google",
        avatar: { public_id: "", url: picture || "" },
      });
    }
  }

  // ── Issue JWT cookie — same flow as regular login ─────────────────────────
  sendToken(user, 200, res);
});