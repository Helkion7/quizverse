const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/categoryController");
const { isAuthenticated, isAdmin } = require("../middleware/authMiddleware");

// Public routes
router.get("/", categoryController.getAllCategories);
router.get("/tags", categoryController.getTagCloud);
router.get("/tag/:tag", categoryController.getQuizzesByTag);
router.get("/:slug", categoryController.getQuizzesByCategory);

// Admin routes
router.get(
  "/admin",
  isAuthenticated,
  isAdmin,
  categoryController.getAdminCategories
);
router.post(
  "/admin/create",
  isAuthenticated,
  isAdmin,
  categoryController.createCategory
);

module.exports = router;
