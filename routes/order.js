import express from "express";

import isAuthenticated, { adminRoutes } from "../middlewares/auth.js";
import {
  createOrder,
  getAllOrders,
  myOrders,
  orderDetails,
  updateOrder,
  deleteOrder,
} from "../controllers/order.js";

const router = express.Router();

router.post("/new", createOrder);

router.get("/my", myOrders);

router.get("/all", getAllOrders);

router
  .route("/:id")
  .put(updateOrder)
  .delete(isAuthenticated, adminRoutes, deleteOrder)
  .get(orderDetails);

export default router;
