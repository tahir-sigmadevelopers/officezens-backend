import express from "express";
import {
  getAllProducts,
  newProduct,
  updateProduct,
  deleteProduct,
  productDetails,
  userReview,
  getAllReviews,
  deleteReview,
  getAdminProducts,
  getLatestProducts,
  getOldProducts,
  getAllCategories,
} from "../controllers/product.js";
import isAuthenticated, { adminRoutes } from "../middlewares/auth.js";

const router = express.Router();

router.post("/new", newProduct);
router.get("/latest", getLatestProducts);
router.get("/old", getOldProducts);
router.get("/all", getAllProducts);
router.get("/allcategories", getAllCategories);

router.put("/review", isAuthenticated, userReview);
router.get("/reviews/all", isAuthenticated, adminRoutes, getAllReviews);
router.delete("/review", isAuthenticated, adminRoutes, deleteReview);

router.get("/admin/products", getAdminProducts);
router
  .route("/:id")
  .put(updateProduct)
  .delete(deleteProduct)
  .get(productDetails);
// router.get("/:id", productDetails);

export default router;
