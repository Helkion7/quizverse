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
router.get("/:id", quizController.getQuizDetails);

// Add a new route for handling unauthenticated quiz view attempts
router.get("/auth-required/:id", quizController.authRequiredForQuiz);

// Add route for authentication check
router.get("/auth-check/:id", (req, res) => {
  if (req.isAuthenticated()) {
    res.redirect(`/quiz/${req.params.id}`);
  } else {
    res.redirect(`/auth/login?returnTo=/quiz/${req.params.id}`);
  }
});

// Quiz taking routes
router.get("/:id/take", quizController.getTake);
router.post("/:id/submit", quizController.postSubmit);

module.exports = router;
