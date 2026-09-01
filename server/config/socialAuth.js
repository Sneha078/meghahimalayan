import { OAuth2Client } from "google-auth-library";

export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

if (!GOOGLE_CLIENT_ID) {
  console.warn("Warning: GOOGLE_CLIENT_ID is not defined.");
}

export const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);