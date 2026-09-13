import axios from "axios";
import { OAuth2Client } from "google-auth-library";
import User from "../models/userModel.js";
import HandleError from "../utils/handleError.js";
import handleAsyncError from "../middleware/handleAsyncError.js";
import { sendToken } from "../utils/jwtToken.js";

// ─────────────────────────────────────────────────────────────────────────────
// GOOGLE LOGIN
// POST /api/v1/auth/google
//
// Accepts either:
//   { idToken }      — credential from useGoogleLogin flow:"auth-code" or GoogleLogin component
//   { accessToken }  — access_token from useGoogleLogin flow:"implicit" (default)
//
// The frontend uses @react-oauth/google useGoogleLogin with flow:"implicit"
// which returns an access_token. We call Google's userinfo endpoint to verify it.
// ─────────────────────────────────────────────────────────────────────────────
export const googleLogin = handleAsyncError(async (req, res, next) => {
  const { idToken, accessToken } = req.body;

  if (!idToken && !accessToken) {
    return next(new HandleError("Google token is required", 400));
  }

  let googleId, email, name, picture;

  if (idToken) {
    // ── Path A: ID token (credential) ─────────────────────────────────────
    // Used when frontend sends a credential string (GoogleLogin component)
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

    googleId = payload.sub;
    email    = payload.email;
    name     = payload.name;
    picture  = payload.picture;

  } else {
    // ── Path B: Access token (implicit flow) ──────────────────────────────
    // Used when frontend sends an access_token from useGoogleLogin
    // We verify it by calling Google's userinfo API
    try {
      const { data } = await axios.get(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      googleId = data.sub;
      email    = data.email;
      name     = data.name;
      picture  = data.picture;
    } catch (err) {
      return next(new HandleError("Invalid or expired Google access token", 401));
    }
  }

  if (!email) {
    return next(
      new HandleError("Google account does not have an email address", 400)
    );
  }

  // ── Find or create user ───────────────────────────────────────────────────
  // Priority:
  //   1. Find by googleId  (returning Google user)
  //   2. Find by email     (already registered with email/password — link accounts)
  //   3. Create new user
  let user = await User.findOne({ googleId });

  if (!user) {
    user = await User.findOne({ email });

    if (user) {
      // Link Google account to existing email/password account
      user.googleId     = googleId;
      user.authProvider = "google";

      if (!user.avatar?.url && picture) {
        user.avatar = { public_id: "", url: picture };
      }

      await user.save({ validateBeforeSave: false });
    } else {
      // Brand new user — create account automatically
      user = await User.create({
        name:         name || email.split("@")[0],
        email,
        googleId,
        authProvider: "google",
        avatar:       { public_id: "", url: picture || "" },
      });
    }
  }

  // Issue JWT cookie — same flow as regular login
  sendToken(user, 200, res);
});
