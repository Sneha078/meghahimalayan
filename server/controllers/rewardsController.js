import Product from "../models/productModel.js"; // adjust path if your Product model lives elsewhere
import HandleError from "../utils/handleError.js";
import handleAsyncError from "../middleware/handleAsyncError.js";
import {
  getBalance,
  getExpiringSoon,
  getHistory,
  calculateDiscount,
  redeemPoints,
  POINTS_TO_RUPEE_RATE,
} from "../services/pointsService.js";

// GET /api/v1/rewards/balance
export const getRewardsBalance = handleAsyncError(async (req, res) => {
  const balance = await getBalance(req.user._id);
  const expiring = await getExpiringSoon(req.user._id, 7);

  res.status(200).json({
    success: true,
    balance,
    cashValue: Number((balance * POINTS_TO_RUPEE_RATE).toFixed(2)),
    expiringSoon: expiring.totalExpiring,
    expiringDate: expiring.soonest,
  });
});

// Point-cost bands for the Rewards catalog
const POINT_TIERS = [
  { key: "200-500", min: 200, max: 500 },
  { key: "501-800", min: 501, max: 800 },
  { key: "801-1300", min: 801, max: 1300 },
  { key: "1300+", min: 1301, max: Infinity },
];

function bandForPoints(points) {
  return POINT_TIERS.find((t) => points >= t.min && points <= t.max)?.key ?? null;
}

// GET /api/v1/rewards/catalog?maxPoints=1500
export const getRewardsCatalog = handleAsyncError(async (req, res) => {
  const filter = { pointsCost: { 
     $gte: 200 } };
  if (req.query.maxPoints) filter.pointsCost.$lte = Number(req.query.maxPoints);

  const rewards = await Product.find(filter).sort({ pointsCost: 1 });

  const tiers = {};
  for (const product of rewards) {
    const band = bandForPoints(product.pointsCost);
    if (!band) continue;
    if (!tiers[band]) tiers[band] = [];
    tiers[band].push(product);
  }

  res.status(200).json({ success: true, tiers, tierOrder: POINT_TIERS.map((t) => t.key) });
});

// POST /api/v1/rewards/redeem   body: { productId }
export const redeemReward = handleAsyncError(async (req, res, next) => {
  const { productId } = req.body;
  const product = await Product.findById(productId);

  if (!product || !product.pointsCost) {
    return next(new HandleError("Reward not found", 404));
  }

  try {
    await redeemPoints(req.user._id, product.pointsCost, product.name);
  } catch (err) {
    return next(new HandleError(err.message, err.status || 400));
  }

  // TODO: hook into your order-creation logic so the redeemed product
  // actually gets fulfilled/shipped like a normal order.

  const newBalance = await getBalance(req.user._id);
  res.status(200).json({ success: true, message: "Redeemed successfully", balance: newBalance });
});

// GET /api/v1/rewards/redeem-preview?points=200&subtotal=10908
export const getRedeemPreview = handleAsyncError(async (req, res, next) => {
  const points = Number(req.query.points) || 0;
  const subtotal = Number(req.query.subtotal) || 0;
  const balance = await getBalance(req.user._id);

  if (points > balance) {
    return next(new HandleError("Not enough points", 400));
  }

  const discount = calculateDiscount(points, subtotal);
  res.status(200).json({ success: true, discount, balance });
});

// GET /api/v1/rewards/history?type=earn|redeem|expire  (omit type for all)
export const getRewardsHistory = handleAsyncError(async (req, res) => {
  const { type } = req.query;
  const validTypes = ["earn", "redeem", "expire"];
  const entries = await getHistory(req.user._id, validTypes.includes(type) ? type : undefined);

  res.status(200).json({ success: true, entries });
});