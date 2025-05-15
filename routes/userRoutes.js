const express = require("express");
const router = express.Router();
const { isAuthenticated } = require("../middleware/authMiddleware");
const User = require("../models/User");
const QuizAttempt = require("../models/QuizAttempt");

// User controller with stats calculation
const userController = {
  getDashboard: async (req, res) => {
    try {
      if (!req.user) {
        return res.render("users/dashboard", {
          title: "Dashboard",
          isAuthenticated: false,
        });
      }

      // Find user and populate quiz attempts
      const user = await User.findById(req.user.id)
        .populate("attemptedQuizzes")
        .populate("createdQuizzes");

      // Calculate stats
      const quizzesTaken = user.attemptedQuizzes.length;
      const quizzesCreated = user.createdQuizzes.length;

      // Calculate average score
      let averageScore = 0;
      if (quizzesTaken > 0) {
        const totalScore = await QuizAttempt.aggregate([
          { $match: { user: user._id, completed: true } },
          { $group: { _id: null, average: { $avg: "$percentageScore" } } },
        ]);

        averageScore =
          totalScore.length > 0 ? Math.round(totalScore[0].average) : 0;
      }

      res.render("users/dashboard", {
        title: "Dashboard",
        isAuthenticated: true,
        user: req.user,
        stats: {
          quizzesTaken,
          quizzesCreated,
          averageScore,
        },
      });
    } catch (error) {
      console.error("Dashboard error:", error);
      res.status(500).render("error", { message: "Error loading dashboard" });
    }
  },

  getProfile: async (req, res) => {
    try {
      if (!req.user) {
        return res.render("users/profile", {
          title: "User Profile",
          isAuthenticated: false,
        });
      }

      // Find user and populate quiz attempts
      const user = await User.findById(req.user.id)
        .populate("attemptedQuizzes")
        .populate("createdQuizzes");

      // Calculate stats
      const quizzesTaken = user.attemptedQuizzes.length;
      const quizzesCreated = user.createdQuizzes.length;

      // Calculate average score
      let averageScore = 0;
      if (quizzesTaken > 0) {
        const totalScore = await QuizAttempt.aggregate([
          { $match: { user: user._id, completed: true } },
          { $group: { _id: null, average: { $avg: "$percentageScore" } } },
        ]);

        averageScore =
          totalScore.length > 0 ? Math.round(totalScore[0].average) : 0;
      }

      res.render("users/profile", {
        title: "User Profile",
        isAuthenticated: true,
        user: req.user,
        stats: {
          quizzesTaken,
          quizzesCreated,
          averageScore,
        },
      });
    } catch (error) {
      console.error("Profile error:", error);
      res.status(500).render("error", { message: "Error loading profile" });
    }
  },
};

// User dashboard route
router.get("/dashboard", isAuthenticated, userController.getDashboard);

// User profile route
router.get("/profile", isAuthenticated, userController.getProfile);

module.exports = router;
