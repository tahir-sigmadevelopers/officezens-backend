import express from "express";
import {
  registerUser,
  getAllUsers,
  loginUser,
  logoutUser,
  getMyProfile,
  forgotPassword,
  resetPassword,
  updatePassword,
  updateProfile,
  getUserDetail,
  updateUserProfile,
  deleteUserProfile,
} from "../controllers/user.js";
import isAuthenticated, { adminRoutes } from "../middlewares/auth.js";

const router = express.Router();

router.post("/register", registerUser);

router.post("/login", loginUser);

router.put("/password/update", isAuthenticated, updatePassword);

router.put("/profile/update", isAuthenticated, updateProfile);

router.post("/forgotpassword", forgotPassword);

router.put("/password/reset/:ecommerce", resetPassword);

router.get("/logout", logoutUser);

router.get("/profile", isAuthenticated, getMyProfile);



// Admin Routes
router.get("/all", isAuthenticated, adminRoutes, getAllUsers);

router
  .route("/:id")
  .get(getUserDetail)
  .put(isAuthenticated, adminRoutes, updateUserProfile)
  .delete(isAuthenticated, adminRoutes, deleteUserProfile);


export default router;
