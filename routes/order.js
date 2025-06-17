import express from "express";

import { isAuthenticated, adminRoutes } from "../middlewares/auth.js";
import {
  createOrder,
  getAllOrders,
  myOrders,
  orderDetails,
  updateOrder,
  deleteOrder,
} from "../controllers/order.js";

const router = express.Router();

// Create a new middleware that makes authentication optional
const optionalAuth = (req, res, next) => {
  // Try to authenticate, but continue even if it fails
  isAuthenticated(req, res, (err) => {
    // Continue to the next middleware regardless of authentication result
    next();
  });
};

router.post("/new", createOrder);

router.get("/my", optionalAuth, myOrders);

router.get("/all", isAuthenticated, adminRoutes, getAllOrders);

router
  .route("/:id")
  .put(isAuthenticated, adminRoutes, updateOrder)
  .delete(isAuthenticated, adminRoutes, deleteOrder)
  .get(optionalAuth, orderDetails);

export default router;
