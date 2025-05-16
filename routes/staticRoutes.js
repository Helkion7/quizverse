const express = require("express");
const router = express.Router();
const quizController = require("../controllers/quizController");

// Placeholder for static controller (will implement later)
const staticController = {
  getFaq: (req, res) => {
    res.render("faqPublic", { title: "Frequently Asked Questions" });
  },
};

// Home page
router.get("/", async (req, res) => {
  try {
    // Fetch quizzes using the same method as browse page
    const quizzes = await quizController.getQuizzes();
    res.render("index", {
      title: "QuizVerse - Home",
      quizzes: quizzes,
    });
  } catch (error) {
    console.error("Error fetching quizzes for homepage:", error);
    res.render("index", {
      title: "QuizVerse - Home",
      quizzes: [],
    });
  }
});

// FAQ page
router.get("/faq", staticController.getFaq);

module.exports = router;
