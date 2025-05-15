const User = require("../models/User");
const Quiz = require("../models/Quiz");
const QuizAttempt = require("../models/QuizAttempt");
const mongoose = require("mongoose");

// Helper function to get date for time period filtering
const getDateForTimePeriod = (period) => {
  const now = new Date();
  switch (period) {
    case "weekly":
      return new Date(now.setDate(now.getDate() - 7));
    case "monthly":
      return new Date(now.setMonth(now.getMonth() - 1));
    default:
      return new Date(0); // All time - start of epoch
  }
};

exports.getGlobalLeaderboard = async (req, res) => {
  try {
    const period = req.query.period || "all-time";
    const startDate = getDateForTimePeriod(period);

    // Aggregate to find top performers across all quizzes
    const leaderboard = await QuizAttempt.aggregate([
      {
        $match: {
          completed: true,
          completedAt: { $gte: startDate },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "userInfo",
        },
      },
      { $unwind: "$userInfo" },
      {
        $group: {
          _id: "$user",
          username: { $first: "$userInfo.username" },
          avgScore: { $avg: "$percentageScore" },
          totalQuizzes: { $sum: 1 },
          bestScore: { $max: "$percentageScore" },
          fastestTime: { $min: "$timeTaken" },
        },
      },
      {
        $project: {
          _id: 1,
          username: 1,
          avgScore: { $round: ["$avgScore", 1] },
          totalQuizzes: 1,
          bestScore: { $round: ["$bestScore", 1] },
          fastestTime: 1,
        },
      },
      { $sort: { avgScore: -1, totalQuizzes: -1 } },
      { $limit: 10 },
    ]);

    res.render("leaderboards/global", {
      title: "Global Leaderboard",
      leaderboard,
      period,
      user: req.user,
      isAuthenticated: !!req.user,
    });
  } catch (error) {
    console.error("Error getting global leaderboard:", error);
    res.status(500).render("error", {
      message: "Error loading leaderboard data",
    });
  }
};

exports.getQuizLeaderboard = async (req, res) => {
  try {
    const quizId = req.params.id;
    const period = req.query.period || "all-time";
    const startDate = getDateForTimePeriod(period);

    // Verify quiz exists
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).render("error", {
        message: "Quiz not found",
      });
    }

    // Get leaderboard for specific quiz
    const leaderboard = await QuizAttempt.aggregate([
      {
        $match: {
          quiz: mongoose.Types.ObjectId(quizId),
          completed: true,
          completedAt: { $gte: startDate },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "userInfo",
        },
      },
      { $unwind: "$userInfo" },
      {
        $project: {
          username: "$userInfo.username",
          percentageScore: 1,
          timeTaken: 1,
          completedAt: 1,
        },
      },
      { $sort: { percentageScore: -1, timeTaken: 1 } },
      { $limit: 10 },
    ]);

    res.render("leaderboards/quiz", {
      title: `Leaderboard: ${quiz.title}`,
      quiz,
      leaderboard,
      period,
      user: req.user,
      isAuthenticated: !!req.user,
    });
  } catch (error) {
    console.error("Error getting quiz leaderboard:", error);
    res.status(500).render("error", {
      message: "Error loading leaderboard data",
    });
  }
};
