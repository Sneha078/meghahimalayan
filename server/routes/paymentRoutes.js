// payment/esewa/*, /payment/khalti/*, payment/bank-transferimport express from "express";
import {
  initiateEsewa,
  verifyEsewa,
  initiateKhalti,
  verifyKhalti,
  getBankDetails,
  submitBankTransfer,
  reviewBankTransfer,
} from "../controllers/paymentController.js";
import { verifyUserAuth, roleBasedAccess } from "../middleware/userAuth.js";

const router = express.Router();

// eSewa
router.route("/payment/esewa/initiate").post(verifyUserAuth, initiateEsewa);
router.route("/payment/esewa/verify").get(verifyEsewa); // eSewa redirects here directly, no auth header available

// Khalti
router.route("/payment/khalti/initiate").post(verifyUserAuth, initiateKhalti);
router.route("/payment/khalti/verify").get(verifyKhalti); // same — gateway redirect, no auth header

// Bank transfer
router.route("/payment/bank-transfer/details").get(getBankDetails);
router.route("/payment/bank-transfer/submit").post(verifyUserAuth, submitBankTransfer);
router.route("/payment/bank-transfer/:id/review").patch(verifyUserAuth, roleBasedAccess("admin"), reviewBankTransfer);

export default router;