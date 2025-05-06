const express = require("express");
const router = express.Router();
const { isAuthenticated } = require("../middleware/authMiddleware");

// Placeholder for user controller (will implement later)
const userController = {
  getDashboard: (req, res) => {
    res.render("users/dashboard", { title: "Dashboard" });
  },
  getProfile: (req, res) => {
    res.render("users/profile", { title: "My Profile" });
  },
};

// User dashboard route
router.get("/dashboard", isAuthenticated, userController.getDashboard);

// User profile route
router.get("/profile", isAuthenticated, userController.getProfile);

module.exports = router;
