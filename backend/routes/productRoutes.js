// routes/productRoutes.js
const express = require("express");
const router = express.Router();
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  deleteProductImage,
  addReview,
  deleteReview,
  getProductMeta,
  getMyProducts,
} = require("../controllers/productController");
const { protect, authorize } = require("../middleware/auth");
const { uploadProductImage } = require("../config/cloudinary");

// ── IMPORTANT: specific named routes MUST come before /:id routes ──
// Otherwise Express matches 'meta', 'seller' etc. as an :id param

// Public named routes
router.get("/meta", getProductMeta);

// Seller route — must be before /:id
router.get(
  "/seller/my-products",
  protect,
  authorize("seller", "admin"),
  getMyProducts,
);

// Create product
router.post(
  "/",
  protect,
  authorize("seller", "admin"),
  uploadProductImage.array("images", 5),
  createProduct,
);

// Public list + single product (/:id must come AFTER all named routes)
router.get("/", getProducts);
router.get("/:id", getProduct);

// Update / Delete product
router.put(
  "/:id",
  protect,
  authorize("seller", "admin"),
  uploadProductImage.array("images", 5),
  updateProduct,
);
router.delete("/:id", protect, authorize("seller", "admin"), deleteProduct);
router.delete(
  "/:id/images/:imageId",
  protect,
  authorize("seller", "admin"),
  deleteProductImage,
);

// Reviews
router.post("/:id/reviews", protect, authorize("user", "admin"), addReview);
router.delete("/:id/reviews/:reviewId", protect, deleteReview);

module.exports = router;
