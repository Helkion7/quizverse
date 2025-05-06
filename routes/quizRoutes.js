const express = require("express");
const router = express.Router();
const { isAuthenticated } = require("../middleware/authMiddleware");
const quizController = require("../controllers/quizController");

// Debug middleware
router.use((req, res, next) => {
  console.log("Quiz route accessed:", req.method, req.path);
  console.log("User authenticated:", !!req.user);
  next();
});

// Browse quizzes
router.get("/browse", quizController.getBrowse);

// Quiz creation routes
router.get("/create", isAuthenticated, quizController.getCreate);
router.post("/create", isAuthenticated, quizController.postCreate);

// Quiz details
router.get("/:id", quizController.getDetails);

// Quiz taking routes
router.get("/:id/take", quizController.getTake);
router.post("/:id/submit", quizController.postSubmit);

module.exports = router;
