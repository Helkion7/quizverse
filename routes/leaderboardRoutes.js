const express = require("express");
const router = express.Router();
const leaderboardController = require("../controllers/leaderboardController");

// Global leaderboard route
router.get("/", leaderboardController.getGlobalLeaderboard);

// Quiz-specific leaderboard route
router.get("/quiz/:id", leaderboardController.getQuizLeaderboard);

module.exports = router;
