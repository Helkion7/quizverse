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
  try {
    const quizId = req.params.id;

    if (!quizId) {
      console.error("No quiz ID provided");
      return res.status(400).render("error", {
        title: "Error",
        message: "Invalid quiz ID provided.",
      });
    }

    console.log("Auth check for quiz ID:", quizId);

    if (req.user) {
      console.log("User is authenticated, redirecting to quiz");
      return res.redirect(`/quiz/${quizId}`);
    } else {
      console.log("User is not authenticated, redirecting to login");
      return res.redirect(`/auth/login?returnTo=/quiz/${quizId}`);
    }
  } catch (error) {
    console.error("Error in auth-check route:", error);
    return res.status(500).render("error", {
      title: "Server Error",
      message: "An unexpected error occurred. Please try again later.",
    });
  }
});

// Quiz taking routes
router.get("/:id/take", quizController.getTake);
router.post("/:id/submit", quizController.postSubmit);

module.exports = router;
