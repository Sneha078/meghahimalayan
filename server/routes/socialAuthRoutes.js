import express from "express";
import { googleLogin } from "../controllers/socialAuthController.js";

const router = express.Router();

// POST /api/v1/auth/google
// Body: { idToken: "eyJ..." } ← Google ID token from @react-oauth/google
router.post("/auth/google", googleLogin);

export default router;