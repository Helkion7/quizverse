const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { isAuthenticated, isAdmin } = require("../middleware/authMiddleware");

// Apply authentication and admin checks to all routes
router.use(isAuthenticated, isAdmin);

// Admin dashboard
router.get("/dashboard", adminController.getDashboard);

// API routes for user management
router.get("/users", adminController.getUsers);
router.delete("/users/:id", adminController.deleteUser);

module.exports = router;
