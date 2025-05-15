const jwt = require("jsonwebtoken");
const GameSession = require("./models/GameSession");
const Quiz = require("./models/Quiz");

module.exports = (io) => {
  // Socket middleware to authenticate users from JWT token
  io.use((socket, next) => {
    const token =
      socket.handshake.auth.token ||
      socket.handshake.headers.cookie?.split("token=")[1]?.split(";")[0];

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.user = decoded;
        next();
      } catch (err) {
        socket.user = null;
        next();
      }
    } else {
      socket.user = null;
      next();
    }
  });

  // Game session namespace
  const gameSpace = io.of("/game");

  gameSpace.on("connection", (socket) => {
    console.log("New client connected to game space", socket.id);

    // Keep track of which game session this socket is in
    let currentGameCode = null;
    let isHost = false;
    let playerNickname = null;

    // Join a game session
    socket.on("join-game", async ({ gameCode, nickname }) => {
      try {
        // Convert to uppercase for consistency
        gameCode = gameCode.toUpperCase();

        // Find the game session
        const gameSession = await GameSession.findOne({ code: gameCode })
          .populate("quiz")
          .populate("hostId");

        if (!gameSession) {
          return socket.emit("error", { message: "Game session not found" });
        }

        // Check if game has already started
        if (gameSession.status === "in-progress") {
          return socket.emit("error", { message: "Game already in progress" });
        }

        // Check if game has ended
        if (gameSession.status === "completed") {
          return socket.emit("error", { message: "Game has already ended" });
        }

        // Check if user is the host
        if (
          socket.user &&
          socket.user.id === gameSession.hostId?._id.toString()
        ) {
          isHost = true;
        }

        // Join the game's socket room
        socket.join(gameCode);
        currentGameCode = gameCode;
        playerNickname = nickname;

        // Update player list in session
        if (!isHost) {
          // Check if player with this nickname already exists
          const existingPlayer = gameSession.players.find(
            (p) => p.nickname === nickname
          );

          if (!existingPlayer) {
            const player = {
              nickname: nickname,
              socketId: socket.id,
              score: 0,
              answers: [],
            };

            // Add user ID if authenticated
            if (socket.user) {
              player.userId = socket.user.id;
            }

            gameSession.players.push(player);
            await gameSession.save();

            // Broadcast updated player list to all clients in the game
            gameSpace.to(gameCode).emit("player-joined", {
              nickname: nickname,
              players: gameSession.players.map((p) => ({
                nickname: p.nickname,
                score: p.score,
              })),
            });
          } else {
            // Update existing player's socket ID
            existingPlayer.socketId = socket.id;
            await gameSession.save();

            // Notify player they've reconnected
            socket.emit("reconnected", {
              nickname: nickname,
              gameStatus: gameSession.status,
            });
          }
        }

        // Notify client they've joined
        socket.emit("joined-game", {
          code: gameCode,
          isHost: isHost,
          quiz: {
            title: gameSession.quiz.title,
            description: gameSession.quiz.description,
            questionCount: gameSession.quiz.questions.length,
          },
          players: gameSession.players.map((p) => ({
            nickname: p.nickname,
            score: p.score,
          })),
        });
      } catch (error) {
        console.error("Error in join-game event:", error);
        socket.emit("error", { message: "Failed to join game" });
      }
    });

    // Start the game (host only)
    socket.on("start-game", async () => {
      try {
        if (!currentGameCode || !isHost) {
          return socket.emit("error", {
            message: "Unauthorized to start game",
          });
        }

        const gameSession = await GameSession.findOne({
          code: currentGameCode,
        }).populate("quiz");

        if (!gameSession) {
          return socket.emit("error", { message: "Game session not found" });
        }

        // Check player count
        if (gameSession.players.length === 0) {
          return socket.emit("error", {
            message: "No players have joined yet",
          });
        }

        // Update game status
        gameSession.status = "in-progress";
        gameSession.currentQuestionIndex = 0;
        gameSession.startedAt = new Date();
        await gameSession.save();

        // Notify all clients in the game that the game has started
        gameSpace.to(currentGameCode).emit("game-started", {
          message: "The quiz has started",
          questionCount: gameSession.quiz.questions.length,
        });

        // Start the first question after a short delay
        setTimeout(() => {
          sendNextQuestion(currentGameCode);
        }, 3000);
      } catch (error) {
        console.error("Error in start-game event:", error);
        socket.emit("error", { message: "Failed to start game" });
      }
    });

    // Submit answer for the current question
    socket.on("submit-answer", async ({ answer }) => {
      try {
        if (!currentGameCode || !playerNickname) {
          return socket.emit("error", { message: "Not in an active game" });
        }

        const gameSession = await GameSession.findOne({
          code: currentGameCode,
        });

        if (!gameSession) {
          return socket.emit("error", { message: "Game session not found" });
        }

        // Check if game is in progress
        if (gameSession.status !== "in-progress") {
          return socket.emit("error", { message: "Game is not in progress" });
        }

        // Find the player
        const player = gameSession.players.find(
          (p) => p.nickname === playerNickname
        );

        if (!player) {
          return socket.emit("error", {
            message: "Player not found in this game",
          });
        }

        // Record the answer (without revealing it to others)
        const currentQuestion =
          gameSession.quiz.questions[gameSession.currentQuestionIndex];
        const answerRecord = {
          questionIndex: gameSession.currentQuestionIndex,
          answer: answer,
          timeElapsed: Date.now() - gameSession.currentQuestionStartedAt,
          isCorrect: false,
          pointsAwarded: 0,
        };

        // Store the answer
        player.answers.push(answerRecord);

        // Set player as answered for the current question
        player.hasAnswered = true;
        await gameSession.save();

        // Acknowledge answer receipt
        socket.emit("answer-received", {
          message: "Your answer has been recorded",
        });

        // Check if all players have answered
        const allPlayersAnswered = gameSession.players.every(
          (p) => p.hasAnswered
        );

        if (allPlayersAnswered || gameSession.questionTimeoutId) {
          // Cancel any existing timeout since all players have answered
          if (gameSession.questionTimeoutId) {
            clearTimeout(gameSession.questionTimeoutId);
            gameSession.questionTimeoutId = null;
            await gameSession.save();
          }

          // Process answers and move to next question
          processAnswersAndContinue(currentGameCode);
        }
      } catch (error) {
        console.error("Error in submit-answer event:", error);
        socket.emit("error", { message: "Failed to submit answer" });
      }
    });

    // Disconnect handling
    socket.on("disconnect", async () => {
      console.log("Client disconnected", socket.id);

      if (currentGameCode) {
        try {
          // Update player's connected status
          const gameSession = await GameSession.findOne({
            code: currentGameCode,
          });

          if (gameSession) {
            if (isHost) {
              // If host disconnects, notify all players
              gameSpace.to(currentGameCode).emit("host-disconnected", {
                message: "The host has disconnected",
              });
            } else if (playerNickname) {
              const player = gameSession.players.find(
                (p) => p.nickname === playerNickname
              );
              if (player) {
                player.connected = false;
                await gameSession.save();

                // Notify others that player has disconnected
                gameSpace.to(currentGameCode).emit("player-disconnected", {
                  nickname: playerNickname,
                });
              }
            }
          }
        } catch (error) {
          console.error("Error handling disconnect:", error);
        }
      }
    });
  });

  // Helper function to send the next question to all clients in a game
  async function sendNextQuestion(gameCode) {
    try {
      const gameSession = await GameSession.findOne({
        code: gameCode,
      }).populate("quiz");

      if (!gameSession || gameSession.status !== "in-progress") {
        return;
      }

      const currentIndex = gameSession.currentQuestionIndex;

      // Check if we've reached the end of questions
      if (currentIndex >= gameSession.quiz.questions.length) {
        // End the game
        return endGame(gameCode);
      }

      // Get the current question
      const question = gameSession.quiz.questions[currentIndex];

      // Set all players as not having answered yet
      gameSession.players.forEach((player) => {
        player.hasAnswered = false;
      });

      // Record when this question was started
      gameSession.currentQuestionStartedAt = Date.now();
      await gameSession.save();

      // Prepare question data to send (without correct answers)
      const questionData = {
        index: currentIndex,
        total: gameSession.quiz.questions.length,
        text: question.questionText,
        type: question.questionType,
        timeLimit: question.timeLimit || 30,
        options: question.options.map((opt) => ({
          id: opt._id,
          text: opt.optionText,
        })),
      };

      // Send question to all clients
      gameSpace.to(gameCode).emit("question", questionData);

      // Set timeout to move to next question if not all answer in time
      const timeoutDuration = (question.timeLimit || 30) * 1000;
      const timeoutId = setTimeout(() => {
        processAnswersAndContinue(gameCode);
      }, timeoutDuration);

      // Store timeout ID in database to cancel if needed
      gameSession.questionTimeoutId = timeoutId;
      await gameSession.save();
    } catch (error) {
      console.error("Error sending next question:", error);
    }
  }

  // Helper function to process answers and continue to next question
  async function processAnswersAndContinue(gameCode) {
    try {
      const gameSession = await GameSession.findOne({
        code: gameCode,
      }).populate("quiz");

      if (!gameSession) {
        return;
      }

      const currentIndex = gameSession.currentQuestionIndex;
      const question = gameSession.quiz.questions[currentIndex];

      // Calculate scores for current question
      for (const player of gameSession.players) {
        const answer = player.answers.find(
          (a) => a.questionIndex === currentIndex
        );

        if (answer) {
          // Determine if the answer is correct and calculate points
          let isCorrect = false;
          let pointsAwarded = 0;

          if (
            question.questionType === "multiple-choice" ||
            question.questionType === "true-false"
          ) {
            const selectedOptions = Array.isArray(answer.answer)
              ? answer.answer
              : [answer.answer];
            const correctOptions = question.options
              .filter((opt) => opt.isCorrect)
              .map((opt) => opt._id.toString());

            // For multiple choice, all correct options must be selected and no incorrect ones
            const correctSelected = selectedOptions.filter((id) =>
              correctOptions.includes(id.toString())
            ).length;

            isCorrect =
              correctSelected === correctOptions.length &&
              selectedOptions.length === correctOptions.length;
          } else if (question.questionType === "short-answer") {
            // Case-insensitive comparison for short answers
            isCorrect =
              answer.answer.toLowerCase() ===
              question.correctAnswer.toLowerCase();
          }

          if (isCorrect) {
            // Base points calculation - default to 100 if not specified in question
            const basePoints = question.points || 100;
            pointsAwarded = basePoints;

            // Difficulty multiplier (if implemented in quiz model)
            if (question.difficulty) {
              const difficultyMultiplier =
                question.difficulty === "hard"
                  ? 1.5
                  : question.difficulty === "medium"
                  ? 1.2
                  : 1;
              pointsAwarded = Math.round(pointsAwarded * difficultyMultiplier);
            }

            // Time bonus (faster answers get more points - up to 50% bonus)
            const timeLimit = (question.timeLimit || 30) * 1000;
            if (answer.timeElapsed < timeLimit * 0.5) {
              const timeBonusPercentage =
                1 - answer.timeElapsed / (timeLimit * 0.5);
              const timeBonus = Math.round(
                basePoints * 0.5 * timeBonusPercentage
              );
              pointsAwarded += timeBonus;
            }

            // Streak bonus - check if this player has consecutive correct answers
            const previousAnswers = player.answers
              .filter((a) => a.questionIndex < currentIndex)
              .sort((a, b) => b.questionIndex - a.questionIndex);

            if (previousAnswers.length > 0 && previousAnswers[0].isCorrect) {
              // Add 10% streak bonus for consecutive correct answers
              const streakBonus = Math.round(basePoints * 0.1);
              pointsAwarded += streakBonus;
            }

            // Update player's total score
            player.score += pointsAwarded;
          }

          // Update answer record
          answer.isCorrect = isCorrect;
          answer.pointsAwarded = pointsAwarded;
        }
      }

      // Save updated game session
      await gameSession.save();

      // Send answer results to all clients
      const answerResults = {
        questionIndex: currentIndex,
        correctOptions: question.options
          .filter((opt) => opt.isCorrect)
          .map((opt) => ({ id: opt._id, text: opt.optionText })),
        correctAnswer:
          question.questionType === "short-answer"
            ? question.correctAnswer
            : undefined,
        playerResults: gameSession.players.map((player) => {
          const answer = player.answers.find(
            (a) => a.questionIndex === currentIndex
          );
          return {
            nickname: player.nickname,
            isCorrect: answer ? answer.isCorrect : false,
            pointsAwarded: answer ? answer.pointsAwarded : 0,
            totalScore: player.score,
          };
        }),
      };

      gameSpace.to(gameCode).emit("answer-results", answerResults);

      // Increment to the next question index
      gameSession.currentQuestionIndex++;
      await gameSession.save();

      // Schedule the next question after results are shown
      setTimeout(() => {
        sendNextQuestion(gameCode);
      }, 5000); // Show results for 5 seconds
    } catch (error) {
      console.error("Error processing answers:", error);
    }
  }

  // Helper function to end the game and show final results
  async function endGame(gameCode) {
    try {
      const gameSession = await GameSession.findOne({
        code: gameCode,
      }).populate("quiz");

      if (!gameSession) {
        return;
      }

      // Update game status
      gameSession.status = "completed";
      gameSession.endedAt = Date.now();
      await gameSession.save();

      // Sort players by score
      const rankedPlayers = [...gameSession.players]
        .sort((a, b) => b.score - a.score)
        .map((player, index) => {
          let rankLabel = `${index + 1}`;

          // Apply special labels for top positions
          if (index === 0) rankLabel = "1st";
          else if (index === 1) rankLabel = "2nd";
          else if (index === 2) rankLabel = "3rd";
          else if (index === 3) rankLabel = "4th";
          else if (index === 4) rankLabel = "5th";

          return {
            rank: index + 1,
            rankLabel: rankLabel,
            nickname: player.nickname,
            score: player.score,
            userId: player.userId,
            // Calculate percentage of max possible score
            scorePercentage: Math.round(
              (player.score /
                gameSession.quiz.questions.reduce(
                  (total, q) => total + (q.points || 100),
                  0
                )) *
                100
            ),
            isTopThree: index < 3,
            isRunnerUp: index >= 3 && index < 5,
          };
        });

      // Send final results to all clients
      gameSpace.to(gameCode).emit("game-ended", {
        message: "The quiz has ended",
        leaderboard: rankedPlayers,
        quizTitle: gameSession.quiz.title,
        totalQuestions: gameSession.quiz.questions.length,
        maxPossibleScore: gameSession.quiz.questions.reduce(
          (total, q) => total + (q.points || 100),
          0
        ),
      });
    } catch (error) {
      console.error("Error ending game:", error);
    }
  }
};
