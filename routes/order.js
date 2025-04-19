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

router.get("/my", isAuthenticated, myOrders);

router.get("/all", isAuthenticated, adminRoutes, getAllOrders);

router
  .route("/:id")
  .put(isAuthenticated, adminRoutes, updateOrder)
  .delete(isAuthenticated, adminRoutes, deleteOrder)
  .get(isAuthenticated, orderDetails);

export default router;
