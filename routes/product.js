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
  newCategory,
  deleteCategory
} from "../controllers/product.js";
import isAuthenticated, { adminRoutes } from "../middlewares/auth.js";
import validateProductImages from "../middlewares/imageValidation.js";

const router = express.Router();

router.post("/new", validateProductImages, newProduct);
router.post("/new/category", newCategory);
router.get("/allcategories", getAllCategories);
router.get("/latest", getLatestProducts);
router.get("/old", getOldProducts);
router.get("/all", getAllProducts);

router.put("/review", isAuthenticated, userReview);
router.get("/reviews/all", isAuthenticated, adminRoutes, getAllReviews);
router.delete("/review", isAuthenticated, adminRoutes, deleteReview);

router.get("/admin/products", getAdminProducts);
router.delete("/delete/category/:id", deleteCategory);
router
.route("/:id")
.put(validateProductImages, updateProduct)
.delete(deleteProduct)
.get(productDetails);
// router.get("/:id", productDetails);

export default router;
