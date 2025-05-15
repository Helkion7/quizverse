/**
 * Game client for real-time quiz functionality
 */
class QuizGameClient {
  constructor(gameCode, playerNickname) {
    this.gameCode = gameCode;
    this.playerNickname = playerNickname;
    this.socket = io("/game");
    this.isHost = false;
    this.currentStreak = 0; // Track player's current streak
    this.setupEventListeners();
  }

  /**
   * Set up Socket.io event listeners
   */
  setupEventListeners() {
    // Connection established
    this.socket.on("connect", () => {
      console.log("Connected to game server");
      this.joinGame();
    });

    // Successfully joined the game
    this.socket.on("joined-game", (data) => {
      console.log("Joined game:", data);
      this.isHost = data.isHost;

      // Update UI based on role (host or player)
      if (this.isHost) {
        this.showHostView(data);
      } else {
        this.showPlayerView(data);
      }

      // Update player list
      this.updatePlayerList(data.players);
    });

    // New player joined
    this.socket.on("player-joined", (data) => {
      console.log("Player joined:", data.nickname);
      this.updatePlayerList(data.players);
      this.showNotification(`${data.nickname} joined the game`);
    });

    // Player disconnected
    this.socket.on("player-disconnected", (data) => {
      console.log("Player disconnected:", data.nickname);
      this.showNotification(`${data.nickname} disconnected`);
    });

    // Game started
    this.socket.on("game-started", (data) => {
      console.log("Game started:", data);
      this.showCountdown(3, () => {
        this.showQuizInterface();
      });
    });

    // Receive question
    this.socket.on("question", (questionData) => {
      console.log("Received question:", questionData);
      this.renderQuestion(questionData);
      this.startQuestionTimer(questionData.timeLimit);
    });

    // Answer received confirmation
    this.socket.on("answer-received", (data) => {
      console.log("Answer received:", data);
      this.showAnswerConfirmation();
    });

    // Question results
    this.socket.on("answer-results", (results) => {
      console.log("Question results:", results);
      this.showQuestionResults(results);
    });

    // Game ended
    this.socket.on("game-ended", (data) => {
      console.log("Game ended:", data);
      this.showGameResults(data);
    });

    // New event handler for player answers data
    this.socket.on("player-answers", (data) => {
      console.log("Player answers:", data);
      this.displayPlayerAnswers(data.players);
    });

    // Error handling
    this.socket.on("error", (error) => {
      console.error("Socket error:", error);
      this.showError(error.message);
    });

    // Connection lost
    this.socket.on("disconnect", () => {
      console.log("Disconnected from game server");
      this.showError("Connection lost. Trying to reconnect...");
    });
  }

  /**
   * Join the game session
   */
  joinGame() {
    this.socket.emit("join-game", {
      gameCode: this.gameCode,
      nickname: this.playerNickname,
    });
  }

  /**
   * Start the game (host only)
   */
  startGame() {
    if (this.isHost) {
      this.socket.emit("start-game");
    }
  }

  /**
   * Submit an answer to the current question
   * @param {string|Array} answer - The player's answer
   */
  submitAnswer(answer) {
    this.socket.emit("submit-answer", { answer });
  }

  /**
   * Render a question and its options
   * @param {Object} questionData - The question data
   */
  renderQuestion(questionData) {
    const questionContainer = document.getElementById("question-container");
    const optionsContainer = document.getElementById("options-container");

    // Clear previous content
    questionContainer.innerHTML = "";
    optionsContainer.innerHTML = "";

    // Question progress
    const progress = document.createElement("div");
    progress.className = "question-progress slide-in";
    progress.textContent = `Question ${questionData.index + 1} of ${
      questionData.total
    }`;
    questionContainer.appendChild(progress);

    // Question text
    const questionText = document.createElement("h2");
    questionText.className = "question-text fade-in";
    questionText.textContent = questionData.text;
    questionContainer.appendChild(questionText);

    // Add host controls if user is host
    if (this.isHost) {
      const hostControls = document.createElement("div");
      hostControls.className = "host-controls fade-in";

      const finishButton = document.createElement("button");
      finishButton.className = "finish-question-btn interactive-element";
      finishButton.textContent = "End Question";
      finishButton.addEventListener("click", () => this.finishQuestion());

      hostControls.appendChild(finishButton);
      questionContainer.appendChild(hostControls);
    }

    // Render options based on question type
    if (questionData.type === "multiple-choice") {
      questionData.options.forEach((option) => {
        const optionElement = this.createOptionElement(
          option,
          "checkbox",
          questionData.type
        );
        optionsContainer.appendChild(optionElement);
      });

      // Submit button
      const submitButton = document.createElement("button");
      submitButton.className = "submit-answer fade-in";
      submitButton.textContent = "Submit Answer";
      submitButton.addEventListener("click", () => {
        const selectedOptions = Array.from(
          document.querySelectorAll('input[name="answer"]:checked')
        ).map((input) => input.value);

        if (selectedOptions.length > 0) {
          this.submitAnswer(selectedOptions);
          submitButton.disabled = true;
        } else {
          this.showError("Please select at least one option");
        }
      });

      optionsContainer.appendChild(submitButton);
    } else if (questionData.type === "true-false") {
      // For true/false, we only show True and False options
      const trueOption = { id: "true", text: "True" };
      const falseOption = { id: "false", text: "False" };

      const trueElement = this.createOptionElement(
        trueOption,
        "radio",
        questionData.type
      );
      const falseElement = this.createOptionElement(
        falseOption,
        "radio",
        questionData.type
      );

      optionsContainer.appendChild(trueElement);
      optionsContainer.appendChild(falseElement);

      // Submit button
      const submitButton = document.createElement("button");
      submitButton.className = "submit-answer fade-in";
      submitButton.textContent = "Submit Answer";
      submitButton.addEventListener("click", () => {
        const selectedOption = document.querySelector(
          'input[name="answer"]:checked'
        );

        if (selectedOption) {
          this.submitAnswer(selectedOption.value);
          submitButton.disabled = true;
        } else {
          this.showError("Please select an option");
        }
      });

      optionsContainer.appendChild(submitButton);
    } else if (questionData.type === "short-answer") {
      // Text input for short answer
      const inputContainer = document.createElement("div");
      inputContainer.className = "short-answer-container fade-in";

      const input = document.createElement("input");
      input.type = "text";
      input.name = "answer";
      input.className = "form-control short-answer-input interactive-element";
      input.placeholder = "Your answer...";

      const submitButton = document.createElement("button");
      submitButton.className = "submit-answer fade-in";
      submitButton.textContent = "Submit Answer";
      submitButton.addEventListener("click", () => {
        const answer = input.value.trim();

        if (answer) {
          this.submitAnswer(answer);
          submitButton.disabled = true;
          input.disabled = true;
        } else {
          this.showError("Please enter an answer");
        }
      });

      inputContainer.appendChild(input);
      inputContainer.appendChild(submitButton);
      optionsContainer.appendChild(inputContainer);
    }

    // Show the question interface
    document.getElementById("waiting-screen").style.display = "none";
    document.getElementById("question-screen").style.display = "block";
    document.getElementById("results-screen").style.display = "none";
  }

  /**
   * Finish the current question (host only)
   */
  finishQuestion() {
    if (!this.isHost) return;

    // Show loading state on the button
    const finishButton = document.querySelector(".finish-question-btn");
    if (finishButton) {
      finishButton.disabled = true;
      finishButton.textContent = "Ending...";
    }

    // Send finish question command to server
    this.socket.emit("finish-question");
  }

  /**
   * Display players' answers before showing final results
   * @param {Array} players - List of players with their selected options
   */
  displayPlayerAnswers(players) {
    // Clear the question timer if it exists
    if (this.questionTimer) {
      clearInterval(this.questionTimer);
    }

    const optionsContainer = document.getElementById("options-container");
    optionsContainer.innerHTML = "";

    const playerAnswersContainer = document.createElement("div");
    playerAnswersContainer.className = "player-answers-container slide-in";

    const answersHeader = document.createElement("h3");
    answersHeader.textContent = "Player Answers";
    playerAnswersContainer.appendChild(answersHeader);

    // Group players by their answers
    const answerGroups = {};

    players.forEach((player) => {
      if (!player.selectedOption) return;

      const answer = Array.isArray(player.selectedOption)
        ? player.selectedOption.join(", ")
        : player.selectedOption;

      if (!answerGroups[answer]) {
        answerGroups[answer] = [];
      }

      answerGroups[answer].push(player);
    });

    // Create answer groups display
    Object.keys(answerGroups).forEach((answer) => {
      const answerGroup = document.createElement("div");
      answerGroup.className = "answer-group fade-in";

      const answerLabel = document.createElement("div");
      answerLabel.className = "answer-label";
      answerLabel.textContent = answer;
      answerGroup.appendChild(answerLabel);

      const playersList = document.createElement("div");
      playersList.className = "answer-players";

      answerGroups[answer].forEach((player) => {
        const playerBadge = document.createElement("span");
        playerBadge.className = "player-badge";
        playerBadge.textContent = player.nickname;
        playersList.appendChild(playerBadge);
      });

      answerGroup.appendChild(playersList);
      playerAnswersContainer.appendChild(answerGroup);
    });

    // Add a section for players who haven't answered
    const noAnswerPlayers = players.filter((player) => !player.selectedOption);
    if (noAnswerPlayers.length > 0) {
      const noAnswerGroup = document.createElement("div");
      noAnswerGroup.className = "answer-group no-answer fade-in";

      const noAnswerLabel = document.createElement("div");
      noAnswerLabel.className = "answer-label";
      noAnswerLabel.textContent = "No Answer";
      noAnswerGroup.appendChild(noAnswerLabel);

      const playersList = document.createElement("div");
      playersList.className = "answer-players";

      noAnswerPlayers.forEach((player) => {
        const playerBadge = document.createElement("span");
        playerBadge.className = "player-badge";
        playerBadge.textContent = player.nickname;
        playersList.appendChild(playerBadge);
      });

      noAnswerGroup.appendChild(playersList);
      playerAnswersContainer.appendChild(noAnswerGroup);
    }

    // Add a "Show Results" button for the host
    if (this.isHost) {
      const showResultsButton = document.createElement("button");
      showResultsButton.className = "show-results-btn interactive-element";
      showResultsButton.textContent = "Show Results";
      showResultsButton.addEventListener("click", () => {
        this.socket.emit("show-results");
      });

      playerAnswersContainer.appendChild(showResultsButton);
    } else {
      const waitingMessage = document.createElement("p");
      waitingMessage.className = "waiting-for-host";
      waitingMessage.textContent = "Waiting for host to reveal results...";
      playerAnswersContainer.appendChild(waitingMessage);
    }

    optionsContainer.appendChild(playerAnswersContainer);
  }

  /**
   * Create an option element for multiple choice or true/false questions
   * @param {Object} option - The option data
   * @param {string} inputType - 'checkbox' or 'radio'
   * @param {string} questionType - The type of question
   * @returns {HTMLElement} The option element
   */
  createOptionElement(option, inputType, questionType) {
    const optionElement = document.createElement("div");
    optionElement.className = "option-item fade-in focus-container";

    const input = document.createElement("input");
    input.type = inputType;
    input.name = "answer";
    input.value = option.id;
    input.id = `option-${option.id}`;
    input.className = "interactive-element";

    const label = document.createElement("label");
    label.htmlFor = `option-${option.id}`;
    label.textContent = option.text;

    optionElement.appendChild(input);
    optionElement.appendChild(label);

    return optionElement;
  }

  /**
   * Start a timer for the current question
   * @param {number} timeLimit - Time limit in seconds
   */
  startQuestionTimer(timeLimit) {
    const timerElement = document.getElementById("question-timer");
    let timeLeft = timeLimit;

    // Clear any existing timer
    if (this.questionTimer) {
      clearInterval(this.questionTimer);
    }

    // Update timer display
    timerElement.textContent = `${timeLeft}s`;
    timerElement.className = "fade-in";

    // Start countdown
    this.questionTimer = setInterval(() => {
      timeLeft--;
      timerElement.textContent = `${timeLeft}s`;

      // Update timer visual
      const percentage = (timeLeft / timeLimit) * 100;
      timerElement.style.background = `linear-gradient(to right, var(--color-accent) ${percentage}%, var(--color-border) ${percentage}%)`;

      if (timeLeft <= 0) {
        clearInterval(this.questionTimer);
        // Auto-submit if time runs out
        const submitButton = document.querySelector(".submit-answer");
        if (submitButton && !submitButton.disabled) {
          submitButton.disabled = true;
          this.showNotification("Time's up!");
        }
      }
    }, 1000);
  }

  /**
   * Show confirmation that answer was submitted
   */
  showAnswerConfirmation() {
    const optionsContainer = document.getElementById("options-container");
    const confirmationElement = document.createElement("div");
    confirmationElement.className = "answer-confirmation fade-in";
    confirmationElement.innerHTML = `
      <svg class="icon" viewBox="0 0 24 24">
        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"></path>
      </svg>
      <p>Answer submitted</p>
    `;

    // Replace options with confirmation
    optionsContainer.innerHTML = "";
    optionsContainer.appendChild(confirmationElement);
  }

  /**
   * Show results for the current question
   * @param {Object} results - The question results
   */
  showQuestionResults(results) {
    // Clear the question timer
    if (this.questionTimer) {
      clearInterval(this.questionTimer);
    }

    const resultsContainer = document.getElementById("results-container");
    resultsContainer.innerHTML = "";

    // Create results header
    const resultsHeader = document.createElement("h2");
    resultsHeader.textContent = "Question Results";
    resultsContainer.appendChild(resultsHeader);

    // Show correct answer
    const correctAnswerDiv = document.createElement("div");
    correctAnswerDiv.className = "correct-answer";

    if (results.correctAnswer) {
      // Short answer
      correctAnswerDiv.innerHTML = `<p>Correct answer: <strong>${results.correctAnswer}</strong></p>`;
    } else {
      // Multiple choice or true/false
      const correctOptions = results.correctOptions
        .map((opt) => opt.text)
        .join(", ");
      correctAnswerDiv.innerHTML = `<p>Correct answer: <strong>${correctOptions}</strong></p>`;
    }

    resultsContainer.appendChild(correctAnswerDiv);

    // Update player streak if this is the current player
    const currentPlayerResult = results.playerResults.find(
      (player) => player.nickname === this.playerNickname
    );

    if (currentPlayerResult) {
      if (currentPlayerResult.isCorrect) {
        this.currentStreak++;
        if (this.currentStreak > 1) {
          const streakDiv = document.createElement("div");
          streakDiv.className = "player-streak slide-in";
          streakDiv.textContent = `${this.currentStreak}× Streak!`;
          resultsContainer.appendChild(streakDiv);
        }
      } else {
        this.currentStreak = 0;
      }
    }

    // Create leaderboard
    const leaderboard = document.createElement("div");
    leaderboard.className = "leaderboard";

    // Sort players by total score
    const sortedPlayers = [...results.playerResults].sort(
      (a, b) => b.totalScore - a.totalScore
    );

    sortedPlayers.forEach((player, index) => {
      const playerItem = document.createElement("div");
      playerItem.className = `player-result ${
        player.isCorrect ? "correct" : "incorrect"
      } ${player.nickname === this.playerNickname ? "current-player" : ""}`;

      playerItem.innerHTML = `
        <span class="rank">${index + 1}</span>
        <span class="player-name">${player.nickname}</span>
        <span class="points-this-question ${
          player.pointsAwarded > 0 ? "points-awarded" : ""
        }">${player.pointsAwarded > 0 ? `+${player.pointsAwarded}` : ""}</span>
        <span class="total-score">${player.totalScore}</span>
      `;

      leaderboard.appendChild(playerItem);
    });

    resultsContainer.appendChild(leaderboard);

    // Show results screen
    document.getElementById("waiting-screen").style.display = "none";
    document.getElementById("question-screen").style.display = "none";
    document.getElementById("results-screen").style.display = "block";
  }

  /**
   * Show final game results
   * @param {Object} data - The game results
   */
  showGameResults(data) {
    const gameContainer = document.getElementById("game-container");
    gameContainer.innerHTML = "";

    // Create final results UI
    const finalResults = document.createElement("div");
    finalResults.className = "final-results fade-in";

    // Game title
    const gameTitle = document.createElement("h1");
    gameTitle.textContent = data.quizTitle;
    finalResults.appendChild(gameTitle);

    // Game over message
    const gameOver = document.createElement("h2");
    gameOver.textContent = "Game Over!";
    finalResults.appendChild(gameOver);

    // Create podium for top 3 players
    const podium = document.createElement("div");
    podium.className = "podium";

    // Display top 3 players if available
    const topPlayers = data.leaderboard.filter((player) => player.isTopThree);

    if (topPlayers.length > 0) {
      // Arrange players in the right order for the podium (2nd, 1st, 3rd)
      const podiumOrder = [
        topPlayers.find((p) => p.rank === 2),
        topPlayers.find((p) => p.rank === 1),
        topPlayers.find((p) => p.rank === 3),
      ].filter(Boolean);

      podiumOrder.forEach((player) => {
        const position = player.rank;
        const podiumPlace = document.createElement("div");
        podiumPlace.className = `podium-place place-${position} ${
          player.nickname === this.playerNickname ? "current-player" : ""
        }`;

        podiumPlace.innerHTML = `
          <div class="trophy">${
            position === 1 ? "🏆" : position === 2 ? "🥈" : "🥉"
          }</div>
          <div class="rank-label">${player.rankLabel}</div>
          <div class="player-name">${player.nickname}</div>
          <div class="player-score">${player.score} pts</div>
          <div class="score-percentage">${player.scorePercentage}%</div>
        `;

        podium.appendChild(podiumPlace);
      });
    }

    finalResults.appendChild(podium);

    // Runner-ups section (4th and 5th)
    const runnerUps = data.leaderboard.filter((player) => player.isRunnerUp);

    if (runnerUps.length > 0) {
      const runnerUpsSection = document.createElement("div");
      runnerUpsSection.className = "runner-ups";

      const runnerUpsTitle = document.createElement("h3");
      runnerUpsTitle.textContent = "Runner-ups";
      runnerUpsSection.appendChild(runnerUpsTitle);

      const runnerUpsList = document.createElement("div");
      runnerUpsList.className = "runner-ups-list";

      runnerUps.forEach((player) => {
        const runnerUpItem = document.createElement("div");
        runnerUpItem.className = `runner-up-item ${
          player.nickname === this.playerNickname ? "current-player" : ""
        }`;

        runnerUpItem.innerHTML = `
          <span class="rank-label">${player.rankLabel}</span>
          <span class="player-name">${player.nickname}</span>
          <span class="player-score">${player.score} pts</span>
        `;

        runnerUpsList.appendChild(runnerUpItem);
      });

      runnerUpsSection.appendChild(runnerUpsList);
      finalResults.appendChild(runnerUpsSection);
    }

    // Full leaderboard
    const leaderboard = document.createElement("div");
    leaderboard.className = "final-leaderboard";

    const leaderboardTitle = document.createElement("h3");
    leaderboardTitle.textContent = "Final Leaderboard";
    leaderboard.appendChild(leaderboardTitle);

    const playersList = document.createElement("ul");

    data.leaderboard.forEach((player) => {
      const playerItem = document.createElement("li");
      playerItem.className = `player-rank ${
        player.nickname === this.playerNickname ? "current-player" : ""
      }`;
      playerItem.innerHTML = `
        <span class="rank">#${player.rank}</span>
        <span class="player-name">${player.nickname}</span>
        <span class="player-score">${player.score} pts</span>
      `;
      playersList.appendChild(playerItem);
    });

    leaderboard.appendChild(playersList);
    finalResults.appendChild(leaderboard);

    // Add play again and exit buttons
    const actionsDiv = document.createElement("div");
    actionsDiv.className = "game-actions";

    const exitButton = document.createElement("a");
    exitButton.href = "/";
    exitButton.className = "interactive-element";
    exitButton.textContent = "Exit";
    actionsDiv.appendChild(exitButton);

    if (this.isHost) {
      const playAgainButton = document.createElement("button");
      playAgainButton.className = "interactive-element";
      playAgainButton.textContent = "Play Again";
      playAgainButton.addEventListener("click", () => {
        window.location.reload();
      });
      actionsDiv.appendChild(playAgainButton);
    }

    finalResults.appendChild(actionsDiv);
    gameContainer.appendChild(finalResults);
  }

  /**
   * Show the host view
   * @param {Object} data - Game data
   */
  showHostView(data) {
    const hostControls = document.getElementById("host-controls");
    if (hostControls) {
      hostControls.style.display = "block";

      // Add start button functionality
      const startButton = document.getElementById("start-game");
      if (startButton) {
        startButton.addEventListener("click", () => this.startGame());
      }
    }
  }

  /**
   * Show the player view
   * @param {Object} data - Game data
   */
  showPlayerView(data) {
    const playerWaiting = document.getElementById("player-waiting");
    if (playerWaiting) {
      playerWaiting.style.display = "block";
    }
  }

  /**
   * Update the player list display
   * @param {Array} players - List of players
   */
  updatePlayerList(players) {
    const playerList = document.getElementById("player-list");
    const playerCount = document.getElementById("player-count");

    if (playerList) {
      playerList.innerHTML = "";

      players.forEach((player, index) => {
        const playerItem = document.createElement("li");
        playerItem.className = "player-item fade-in";
        playerItem.innerHTML = `
          <span class="player-number">${index + 1}</span>
          <span class="player-name">${player.nickname}</span>
          ${
            player.score
              ? `<span class="player-score">${player.score}</span>`
              : ""
          }
        `;
        playerList.appendChild(playerItem);
      });
    }

    if (playerCount) {
      playerCount.textContent = players.length;
    }

    // If the user is the host, enable/disable the start button based on player count
    const startButton = document.getElementById("start-game");
    if (startButton && this.isHost) {
      startButton.disabled = players.length === 0;
    }
  }

  /**
   * Show a countdown before starting the quiz
   * @param {number} seconds - Countdown seconds
   * @param {Function} callback - Function to call after countdown
   */
  showCountdown(seconds, callback) {
    const countdownElement =
      document.getElementById("countdown") || document.createElement("div");
    countdownElement.id = "countdown";
    countdownElement.className = "countdown";
    document.body.appendChild(countdownElement);

    let count = seconds;

    const updateCountdown = () => {
      countdownElement.textContent = count;

      if (count <= 0) {
        clearInterval(interval);
        countdownElement.remove();
        callback();
      }
      count--;
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
  }

  /**
   * Show the quiz interface
   */
  showQuizInterface() {
    const waitingScreen = document.getElementById("waiting-screen");
    if (waitingScreen) {
      waitingScreen.style.display = "none";
    }

    const gameContainer = document.getElementById("game-container");
    if (gameContainer) {
      gameContainer.innerHTML = `
        <div id="question-screen" style="display: none;">
          <div id="question-timer" class="fade-in"></div>
          <div id="question-container" class="slide-in"></div>
          <div id="options-container" class="fade-in"></div>
        </div>
        <div id="results-screen" style="display: none;">
          <div id="results-container" class="slide-in"></div>
        </div>
      `;
    }
  }

  /**
   * Show a notification message
   * @param {string} message - The message to show
   */
  showNotification(message) {
    const notificationElement =
      document.getElementById("notification") || document.createElement("div");
    notificationElement.id = "notification";
    notificationElement.className = "notification fade-in";
    notificationElement.textContent = message;

    document.body.appendChild(notificationElement);

    // Show notification
    setTimeout(() => {
      notificationElement.classList.add("show");
    }, 100);

    // Hide after 3 seconds
    setTimeout(() => {
      notificationElement.classList.remove("show");
      // Remove from DOM after animation completes
      setTimeout(() => {
        notificationElement.remove();
      }, 500);
    }, 3000);
  }

  /**
   * Show an error message
   * @param {string} message - The error message
   */
  showError(message) {
    this.showNotification(message);
    console.error(message);
  }
}

// Initialize the game client when the DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  // Check if we're on a game page
  const gameContainer = document.getElementById("game-container");
  if (gameContainer) {
    const gameCode = gameContainer.dataset.gameCode;
    const playerNickname = gameContainer.dataset.playerName;

    if (gameCode) {
      window.gameClient = new QuizGameClient(gameCode, playerNickname);
    }
  }
});
