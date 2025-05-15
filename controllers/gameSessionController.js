const GameSession = require("../models/GameSession");
const Quiz = require("../models/Quiz");
const { generateUniqueGameCode } = require("../utils/gameCodeGenerator");

/**
 * Create a new game session for a quiz
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.createGameSession = async (req, res) => {
  try {
    // Ensure user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required to create a game session",
      });
    }

    const { quizId } = req.body;

    // Validate quiz exists
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found",
      });
    }

    // Generate a unique game code
    let gameCode;
    try {
      gameCode = await generateUniqueGameCode();
    } catch (error) {
      console.error("Failed to generate unique game code:", error);
      return res.status(500).json({
        success: false,
        message: "Unable to generate unique game code. Please try again.",
      });
    }

    // Create a new game session
    const gameSession = new GameSession({
      code: gameCode,
      quiz: quizId,
      hostId: req.user._id,
      players: [],
    });

    // Save the game session
    await gameSession.save();

    return res.status(201).json({
      success: true,
      message: "Game session created successfully",
      session: {
        code: gameSession.code,
        quizTitle: quiz.title,
        playersCount: 0,
      },
    });
  } catch (error) {
    console.error("Error creating game session:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create game session",
      error: error.message,
    });
  }
};

/**
 * Join an existing game session using a game code
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.joinGameSession = async (req, res) => {
  try {
    const { code, nickname } = req.body;

    if (!code || !nickname) {
      return res.status(400).json({
        success: false,
        message: "Game code and nickname are required",
      });
    }

    // Find the game session with the provided code
    const gameSession = await GameSession.findOne({
      code: code.toUpperCase(),
      status: { $ne: "completed" },
    });

    if (!gameSession) {
      return res.status(404).json({
        success: false,
        message: "Game session not found or already completed",
      });
    }

    // Create player object
    const player = {
      nickname: nickname,
      score: 0,
    };

    // Add user ID if authenticated
    if (req.user) {
      player.userId = req.user._id;
    }

    // Add player to session
    gameSession.players.push(player);
    await gameSession.save();

    return res.status(200).json({
      success: true,
      message: "Successfully joined game session",
      session: {
        code: gameSession.code,
        nickname: nickname,
      },
    });
  } catch (error) {
    console.error("Error joining game session:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to join game session",
      error: error.message,
    });
  }
};

/**
 * Get details of a game session by code
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getGameSession = async (req, res) => {
  try {
    const { code } = req.params;

    // Find the game session
    const gameSession = await GameSession.findOne({ code: code.toUpperCase() })
      .populate("quiz", "title description")
      .populate("hostId", "username");

    if (!gameSession) {
      return res.status(404).json({
        success: false,
        message: "Game session not found",
      });
    }

    return res.status(200).json({
      success: true,
      session: {
        code: gameSession.code,
        quiz: gameSession.quiz,
        host: gameSession.hostId.username,
        status: gameSession.status,
        players: gameSession.players.map((p) => ({
          nickname: p.nickname,
          score: p.score,
        })),
        createdAt: gameSession.createdAt,
      },
    });
  } catch (error) {
    console.error("Error retrieving game session:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve game session",
      error: error.message,
    });
  }
};

/**
 * Render the game lobby page
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.renderLobby = async (req, res) => {
  try {
    const { code } = req.params;

    // Find the game session
    const gameSession = await GameSession.findOne({ code: code.toUpperCase() })
      .populate("quiz", "title description")
      .populate("hostId", "username");

    if (!gameSession) {
      return res.status(404).render("error", {
        title: "Game Not Found",
        error: "Game session not found",
        message: "The game you're looking for doesn't exist or has expired.",
      });
    }

    // Check if current user is the host
    const isHost =
      req.user &&
      req.user._id &&
      gameSession.hostId &&
      req.user._id.toString() === gameSession.hostId._id.toString();

    // Render the lobby page
    res.render("game/lobby", {
      title: "Game Lobby",
      gameSession,
      isHost,
      user: req.user,
    });
  } catch (error) {
    console.error("Error rendering game lobby:", error);
    res.status(500).render("error", {
      title: "Server Error",
      error: "Something went wrong!",
      message: "Failed to load the game lobby. Please try again later.",
    });
  }
};
