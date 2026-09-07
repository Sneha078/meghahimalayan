import express from "express";
import {
  getRewardsBalance,
  getRewardsCatalog,
  redeemReward,
  getRedeemPreview,
  getRewardsHistory,
} from "../controllers/rewardsController.js";
import { verifyUserAuth } from "../middleware/userAuth.js";

const router = express.Router();

router.route("/rewards/balance").get(verifyUserAuth, getRewardsBalance);
router.route("/rewards/catalog").get(getRewardsCatalog); // public — no login needed to browse
router.route("/rewards/redeem").post(verifyUserAuth, redeemReward);
router.route("/rewards/redeem-preview").get(verifyUserAuth, getRedeemPreview);
router.route("/rewards/history").get(verifyUserAuth, getRewardsHistory);

export default router;