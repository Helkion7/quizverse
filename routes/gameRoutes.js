const express = require("express");
const router = express.Router();
const gameSessionController = require("../controllers/gameSessionController");
const { isAuthenticated } = require("../middleware/authMiddleware");

// Get the join game page
router.get("/join", (req, res) => {
  res.render("game/join", { title: "Join Quiz Game" });
});

// API endpoint to create a new game session
router.post(
  "/create",
  isAuthenticated,
  gameSessionController.createGameSession
);

// API endpoint to join a game
router.post("/join", gameSessionController.joinGameSession);

// Game lobby page
router.get("/lobby/:code", gameSessionController.renderLobby);

// Game play page
router.get("/play/:code", (req, res) => {
  res.render("game/play", {
    title: "Playing Quiz",
    gameCode: req.params.code,
  });
});

module.exports = router;
