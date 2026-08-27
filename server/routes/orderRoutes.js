import express from "express";
import {
  createNewOrder,
  getMyOrders,
  getMySingleOrder,
  cancelMyOrder,
  getAllOrders,
  getAdminSingleOrder,
  updateOrderStatus,
  deleteOrder,
} from "../controllers/orderController.js";
import { verifyUserAuth, roleBasedAccess } from "../middleware/userAuth.js";

const router = express.Router();

//  Customer 
router.post("/order/new",             verifyUserAuth, createNewOrder);
router.get("/orders/me",              verifyUserAuth, getMyOrders);
router.get("/order/:id",              verifyUserAuth, getMySingleOrder);
router.put("/order/:id/cancel",       verifyUserAuth, cancelMyOrder);

//  Admin 
router.get(
  "/admin/orders",
  verifyUserAuth, roleBasedAccess("admin"),
  getAllOrders
);
router
  .route("/admin/order/:id")
  .get(verifyUserAuth,    roleBasedAccess("admin"), getAdminSingleOrder)
  .put(verifyUserAuth,    roleBasedAccess("admin"), updateOrderStatus)
  .delete(verifyUserAuth, roleBasedAccess("admin"), deleteOrder);

export default router;
