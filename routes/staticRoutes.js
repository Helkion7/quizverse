const express = require("express");
const router = express.Router();

// Placeholder for static controller (will implement later)
const staticController = {
  getHome: (req, res) => {
    res.render("index", { title: "QuizVerse - Home" });
  },
  getFaq: (req, res) => {
    res.render("faq", { title: "Frequently Asked Questions" });
  },
};

// Home page
router.get("/", staticController.getHome);

// FAQ page
router.get("/faq", staticController.getFaq);

module.exports = router;
