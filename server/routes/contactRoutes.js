import express from "express";
import {
  createContactMessage,
  getAllContactMessages,
  updateContactStatus,
  deleteContactMessage,
} from "../controllers/contactController.js";
import { verifyUserAuth, roleBasedAccess } from "../middleware/userAuth.js";

const router = express.Router();

// Public — anyone can submit a contact message 
// verifyUserAuth is NOT required;
// the controller attaches req.user if present
router.post("/contact", createContactMessage);

// Admin
router.get(
  "/admin/messages",
  verifyUserAuth, roleBasedAccess("admin"),
  getAllContactMessages
);
router
  .route("/admin/message/:id")
  .put(verifyUserAuth,    roleBasedAccess("admin"), updateContactStatus)
  .delete(verifyUserAuth, roleBasedAccess("admin"), deleteContactMessage);

export default router;
