const Quiz = require("../models/Quiz");
const User = require("../models/User");
const QuizAttempt = require("../models/QuizAttempt");

// Add this helper function to be reused by other routes
exports.getQuizzes = async () => {
  try {
    const quizzes = await Quiz.find().sort({ createdAt: -1 }).limit(10);
    return quizzes;
  } catch (error) {
    console.error("Error fetching quizzes:", error);
    throw error;
  }
};

// Display quiz browse page
exports.getBrowse = async (req, res) => {
  try {
    const quizzes = await exports.getQuizzes();
    res.render("quizzes/browse", {
      title: "Browse Quizzes",
      quizzes: quizzes,
    });
  } catch (error) {
    console.error("Error in getBrowse:", error);
    res.status(500).render("error", { error: "Failed to load quizzes" });
  }
};

exports.getCreate = (req, res) => {
  console.log(
    "getCreate - User:",
    req.user ? `${req.user.username} (${req.user.role})` : "Not logged in"
  );
  res.render("quizzes/create", {
    title: "Create Quiz",
    user: req.user,
    isAuthenticated: !!req.user,
  });
};

exports.postCreate = async (req, res) => {
  console.log("postCreate - Auth status:", !!req.user);
  if (req.user) {
    console.log("User info:", {
      id: req.user._id || req.user.id,
      username: req.user.username,
      role: req.user.role,
    });
  }

  try {
    // Check if user is authenticated
    if (!req.user || (!req.user._id && !req.user.id)) {
      console.error("Authentication failed: No user in request or missing ID");
      return res.status(401).render("error", {
        title: "Error",
        message: "You must be logged in to create a quiz.",
      });
    }

    const { title, description, category, isPublic, questions } = req.body;

    // Log received data for debugging
    console.log("Received quiz data:", {
      title,
      description,
      category,
      isPublic,
      questionsType: typeof questions,
      questionsLength: questions
        ? typeof questions === "string"
          ? questions.length
          : questions.length
        : 0,
    });

    // Parse questions if they're submitted as JSON string
    let parsedQuestions = [];

    if (questions) {
      try {
        parsedQuestions =
          typeof questions === "string" ? JSON.parse(questions) : questions;

        // Ensure correct structure for each question type
        parsedQuestions = parsedQuestions.map((q) => {
          // For short-answer questions, ensure correctAnswer exists
          if (q.questionType === "short-answer" && !q.correctAnswer) {
            q.correctAnswer = ""; // Default empty string if missing
          }

          // Ensure options array exists for all question types
          if (!q.options) {
            q.options = [];
          }

          return q;
        });

        console.log("Parsed questions:", parsedQuestions);
      } catch (parseError) {
        console.error("Error parsing questions:", parseError);
        return res.status(400).render("error", {
          title: "Error",
          message: "Invalid question format. Please try again.",
        });
      }
    }

    // Fix: Use either _id or id property from req.user
    const userId = req.user._id || req.user.id;

    // Create new quiz
    const newQuiz = new Quiz({
      title,
      description,
      category,
      isPublic: isPublic === "true",
      creator: userId,
      questions: parsedQuestions,
    });

    // Validate the quiz before saving
    const validationError = newQuiz.validateSync();
    if (validationError) {
      console.error("Validation error:", validationError);
      return res.status(400).render("error", {
        title: "Validation Error",
        message: "Quiz validation failed. Please check your input.",
      });
    }

    // Save the quiz
    await newQuiz.save();
    console.log("Quiz saved successfully with ID:", newQuiz._id);

    // Update user's created quizzes
    await User.findByIdAndUpdate(userId, {
      $push: { createdQuizzes: newQuiz._id },
    });

    // Redirect to the edit page to add questions if none were provided
    if (!parsedQuestions || parsedQuestions.length === 0) {
      return res.redirect(`/quiz/${newQuiz._id}/edit`);
    }

    // Redirect to the quiz details page
    res.redirect(`/quiz/${newQuiz._id}`);
  } catch (error) {
    console.error("Error creating quiz:", error);

    // More specific error message based on the error type
    let errorMessage = "Failed to create quiz. Please try again.";

    if (error.name === "ValidationError") {
      errorMessage = `Validation error: ${Object.values(error.errors)
        .map((e) => e.message)
        .join(", ")}`;
    } else if (error.name === "MongoError" && error.code === 11000) {
      errorMessage = "A quiz with this title already exists.";
    }

    res.status(500).render("error", {
      title: "Error",
      message: errorMessage,
    });
  }
};

// Display quiz details
exports.getQuizDetails = async (req, res) => {
  try {
    const quizId = req.params.id;
    console.log("Getting quiz details for ID:", quizId);

    // Find quiz by ID and populate creator information
    const quiz = await Quiz.findById(quizId)
      .populate("creator", "username")
      .exec();

    if (!quiz) {
      return res.status(404).render("error", {
        title: "Quiz Not Found",
        message: "The quiz you're looking for doesn't exist.",
      });
    }

    // Check if user is authenticated and is the creator
    let isCreator = false;
    if (req.user && quiz.creator) {
      // Handle different ID formats (string or ObjectId)
      const userId = req.user._id || req.user.id;
      const creatorId = quiz.creator._id.toString();

      console.log("User ID:", userId);
      console.log("Creator ID:", creatorId);

      // Compare as strings to avoid type issues
      isCreator = userId.toString() === creatorId;
    }

    res.render("quizzes/details", {
      title: quiz.title,
      quiz: quiz,
      isCreator: isCreator,
      user: req.user,
    });
  } catch (error) {
    console.error("Error fetching quiz details:", error);
    res.status(500).render("error", {
      title: "Server Error",
      message: "Failed to load quiz details. Please try again later.",
    });
  }
};

// Display quiz taking interface
exports.getTake = async (req, res) => {
  try {
    const quizId = req.params.id;

    // Find quiz by ID
    const quiz = await Quiz.findById(quizId)
      .populate("creator", "username")
      .exec();

    if (!quiz) {
      return res.status(404).render("error", {
        title: "Quiz Not Found",
        message: "The quiz you're looking for doesn't exist.",
      });
    }

    res.render("quizzes/attempt", {
      title: `Take Quiz: ${quiz.title}`,
      quiz: quiz,
      user: req.user,
    });
  } catch (error) {
    console.error("Error loading quiz for attempt:", error);
    res.status(500).render("error", {
      title: "Error",
      message: "Failed to load quiz. Please try again later.",
    });
  }
};

// Process quiz submission
exports.postSubmit = async (req, res) => {
  try {
    const quizId = req.params.id;
    console.log("Processing quiz submission for ID:", quizId);
    console.log("Form data received:", req.body);

    // Find quiz by ID
    const quiz = await Quiz.findById(quizId);

    if (!quiz) {
      return res.status(404).render("error", {
        title: "Quiz Not Found",
        message: "The quiz you're looking for doesn't exist.",
      });
    }

    // Get answers from form
    let answers = req.body.answers || [];
    console.log("Received answers:", answers);

    // Parse answers from form submission
    let parsedAnswers = [];
    let totalScore = 0;
    let maxPossibleScore = 0;

    // Process each question and calculate score
    quiz.questions.forEach((question, index) => {
      maxPossibleScore += question.points;

      const answer = {
        questionId: question._id,
        isCorrect: false,
        pointsAwarded: 0,
        selectedOptions: [],
        textAnswer: "",
      };

      // Handle when no answer was provided for this question
      if (!answers[index]) {
        parsedAnswers.push(answer);
        return;
      }

      if (question.questionType === "multiple-choice") {
        // Handle multiple choice questions
        const selectedOptions = Array.isArray(answers[index])
          ? answers[index]
          : [answers[index]];

        answer.selectedOptions = selectedOptions;

        // Check if selected options match correct options
        const correctOptions = question.options
          .filter((opt) => opt.isCorrect)
          .map((opt) => opt._id.toString());

        // Simple check - all correct options must be selected and no incorrect ones
        const selectedCount = selectedOptions.length;
        const correctCount = correctOptions.length;
        const correctSelected = selectedOptions.filter((id) =>
          correctOptions.includes(id.toString())
        ).length;

        if (
          correctSelected === correctCount &&
          selectedCount === correctCount
        ) {
          answer.isCorrect = true;
          answer.pointsAwarded = question.points;
          totalScore += question.points;
        }
      } else if (question.questionType === "true-false") {
        // Handle true/false questions
        const selectedOption = answers[index];
        answer.selectedOptions = [selectedOption];

        const correctOption = question.options.find((opt) => opt.isCorrect);
        if (correctOption && selectedOption === correctOption._id.toString()) {
          answer.isCorrect = true;
          answer.pointsAwarded = question.points;
          totalScore += question.points;
        }
      } else if (question.questionType === "short-answer") {
        // Handle short answer questions
        const userAnswer = answers[index] || "";
        answer.textAnswer = userAnswer;

        // Case-insensitive comparison
        if (userAnswer.toLowerCase() === question.correctAnswer.toLowerCase()) {
          answer.isCorrect = true;
          answer.pointsAwarded = question.points;
          totalScore += question.points;
        }
      } else if (question.questionType === "matching") {
        // Handle matching questions
        const selectedMatches = Array.isArray(answers[index])
          ? answers[index]
          : [answers[index]];
        answer.selectedOptions = selectedMatches;

        // Check if all matches are correct
        let correctCount = 0;
        const totalPairs = question.options.length;

        selectedMatches.forEach((match) => {
          const [itemId, matchedTo] = match.split(":::");
          const option = question.options.id(itemId);

          if (option && option.matchTo === matchedTo) {
            correctCount++;
          }
        });

        // Award points proportionally to how many pairs were matched correctly
        if (correctCount > 0) {
          const proportionalScore =
            (correctCount / totalPairs) * question.points;
          answer.pointsAwarded = Math.round(proportionalScore);
          totalScore += answer.pointsAwarded;

          if (correctCount === totalPairs) {
            answer.isCorrect = true;
          }
        }
      } else if (question.questionType === "ordering") {
        // Handle ordering questions
        const selectedOrder = Array.isArray(answers[index])
          ? answers[index]
          : [answers[index]];
        answer.selectedOptions = selectedOrder;

        // Check if the ordering is correct
        let correctCount = 0;
        const totalItems = question.options.length;

        selectedOrder.forEach((itemId, position) => {
          const option = question.options.id(itemId);

          if (option && option.orderPosition === position + 1) {
            correctCount++;
          }
        });

        // Award points proportionally to how many items were correctly ordered
        if (correctCount > 0) {
          const proportionalScore =
            (correctCount / totalItems) * question.points;
          answer.pointsAwarded = Math.round(proportionalScore);
          totalScore += answer.pointsAwarded;

          if (correctCount === totalItems) {
            answer.isCorrect = true;
          }
        }
      } else if (question.questionType === "fill-in-blanks") {
        // Handle fill-in-the-blanks questions
        const userAnswers = Array.isArray(answers[index])
          ? answers[index]
          : [answers[index]];
        answer.textAnswer = userAnswers.join(" | ");

        // Check how many blanks were correctly filled
        let correctCount = 0;

        userAnswers.forEach((userAnswer, i) => {
          if (
            question.blankAnswers[i] &&
            userAnswer.toLowerCase() === question.blankAnswers[i].toLowerCase()
          ) {
            correctCount++;
          }
        });

        // Award points proportionally
        if (correctCount > 0) {
          const proportionalScore =
            (correctCount / question.blankAnswers.length) * question.points;
          answer.pointsAwarded = Math.round(proportionalScore);
          totalScore += answer.pointsAwarded;

          if (correctCount === question.blankAnswers.length) {
            answer.isCorrect = true;
          }
        }
      } else if (question.questionType === "image-selection") {
        // Handle image selection questions
        const selectedAreas = Array.isArray(answers[index])
          ? answers[index]
          : [answers[index]];
        answer.selectedOptions = selectedAreas;

        // Check if the selected areas match the correct areas
        let correctCount = 0;

        selectedAreas.forEach((areaId) => {
          // For image selection, we're using the ID of the coordinate record
          if (
            question.imageCoordinates.some(
              (coord) => coord._id.toString() === areaId
            )
          ) {
            correctCount++;
          }
        });

        // Award points based on correct selections
        if (correctCount > 0) {
          const expectedSelections = question.imageCoordinates.length;
          const proportionalScore =
            (correctCount / expectedSelections) * question.points;
          answer.pointsAwarded = Math.round(proportionalScore);
          totalScore += answer.pointsAwarded;

          // Only mark as fully correct if all intended areas were selected (and no extras)
          if (
            correctCount === expectedSelections &&
            selectedAreas.length === expectedSelections
          ) {
            answer.isCorrect = true;
          }
        }
      }

      parsedAnswers.push(answer);
    });

    console.log("Processed answers:", parsedAnswers);

    // Create a new quiz attempt
    const attempt = new QuizAttempt({
      quiz: quizId,
      // Only include user field if user is authenticated
      ...(req.user && { user: req.user._id || req.user.id }),
      answers: parsedAnswers,
      totalScore,
      maxPossibleScore,
      percentageScore:
        maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0,
      completed: true,
      completedAt: Date.now(),
    });

    await attempt.save();
    console.log("Quiz attempt saved with ID:", attempt._id);

    // Update quiz attempts count
    await Quiz.findByIdAndUpdate(quizId, { $inc: { attempts: 1 } });

    // If user is logged in, add this attempt to their record
    if (req.user) {
      await User.findByIdAndUpdate(req.user._id || req.user.id, {
        $push: { attemptedQuizzes: attempt._id },
      });
    }

    // Render results page
    return res.render("quizzes/results", {
      title: "Quiz Results",
      quiz,
      attempt,
      score: totalScore,
      maxScore: maxPossibleScore,
      percentage: Math.round(
        maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0
      ),
      user: req.user,
    });
  } catch (error) {
    console.error("Error processing quiz submission:", error);
    return res.status(500).render("error", {
      title: "Error",
      message: "Failed to process quiz submission. Please try again later.",
    });
  }
};

// Add this new controller method
exports.authRequiredForQuiz = (req, res) => {
  const quizId = req.params.id;
  // Redirect to login with return URL to the quiz
  res.redirect(`/auth/login?returnTo=/quiz/${quizId}`);
};
