const express = require("express");
const router = express.Router();
const { isAuthenticated } = require("../middleware/authMiddleware");

// Placeholder for quiz controller (will implement later)
const quizController = {
  getBrowse: (req, res) => {
    res.render("quizzes/browse", { title: "Browse Quizzes" });
  },
  getCreate: (req, res) => {
    res.render("quizzes/create", { title: "Create Quiz" });
  },
  getDetails: (req, res) => {
    res.render("quizzes/details", { title: "Quiz Details" });
  },
};

// Browse quizzes
router.get("/browse", quizController.getBrowse);

// Quiz creation routes
router.get("/create", isAuthenticated, quizController.getCreate);

// Quiz details
router.get("/:id", quizController.getDetails);

module.exports = router;
