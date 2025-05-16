const Quiz = require("../models/Quiz");
const User = require("../models/User");
const Category = require("../models/Category");
const QuizAttempt = require("../models/QuizAttempt");
const mongoose = require("mongoose");

// Update the getQuizzes method to support filtering
exports.getQuizzes = async (filters = {}, limit = 10) => {
  try {
    let query = { isPublic: true };

    // Apply additional filters if provided
    if (filters.category) {
      query.category = filters.category;
    }

    if (filters.tag) {
      query.tags = { $in: [filters.tag] };
    }

    if (filters.search) {
      query.$or = [
        { title: { $regex: filters.search, $options: "i" } },
        { description: { $regex: filters.search, $options: "i" } },
      ];
    }

    const quizzes = await Quiz.find(query)
      .populate("creator", "username")
      .populate("category", "name slug")
      .sort({ createdAt: -1 })
      .limit(limit);

    return quizzes;
  } catch (error) {
    console.error("Error fetching quizzes:", error);
    throw error;
  }
};

// Display quiz browse page with filtering
exports.getBrowse = async (req, res) => {
  try {
    const { category, tag, search } = req.query;

    // Get all categories for the filter dropdown
    const categories = await Category.find().sort({ name: 1 });

    // Get popular tags
    const popularTags = await Quiz.aggregate([
      { $match: { isPublic: true } },
      { $unwind: "$tags" },
      { $group: { _id: "$tags", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 15 },
    ]);

    // Apply filters
    const filters = {};
    if (category) filters.category = category;
    if (tag) filters.tag = tag;
    if (search) filters.search = search;

    const quizzes = await exports.getQuizzes(filters, 50);

    res.render("quizzes/browse", {
      title: "Browse Quizzes",
      quizzes,
      categories,
      popularTags: popularTags.map((tag) => ({
        name: tag._id,
        count: tag.count,
      })),
      activeCategory: category,
      activeTag: tag,
      searchQuery: search,
      user: req.user,
    });
  } catch (error) {
    console.error("Error in getBrowse:", error);
    res.status(500).render("error", { error: "Failed to load quizzes" });
  }
};

// Update getCreate to load categories for selection
exports.getCreate = async (req, res) => {
  try {
    // Get all categories for the dropdown
    const categories = await Category.find().sort({ name: 1 });

    // Get popular tags for suggestions
    const popularTags = await Quiz.aggregate([
      { $unwind: "$tags" },
      { $group: { _id: "$tags", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 },
    ]);

    res.render("quizzes/create", {
      title: "Create Quiz",
      categories,
      popularTags: popularTags.map((tag) => tag._id),
      user: req.user,
      isAuthenticated: !!req.user,
    });
  } catch (error) {
    console.error("Error in getCreate:", error);
    res
      .status(500)
      .render("error", { error: "Failed to load quiz creation form" });
  }
};

// Update postCreate to handle category and tags
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

    const {
      title,
      description,
      category: categoryInput,
      isPublic,
      questions,
      tags,
    } = req.body;

    // Resolve categoryInput → valid ObjectId or fallback
    let categoryId;
    if (mongoose.isValidObjectId(categoryInput)) {
      categoryId = categoryInput;
    } else {
      let catDoc = await Category.findOne({ slug: categoryInput });
      if (!catDoc) {
        // try matching name, turning hyphens into spaces
        const nameRegex = new RegExp(
          `^${categoryInput.replace(/-/g, " ")}$`,
          "i"
        );
        catDoc = await Category.findOne({ name: nameRegex });
      }
      if (!catDoc) {
        // Auto-create any of the fallback slugs as a new Category
        const defaultName = categoryInput.replace(/-/g, " ");
        const formattedName = defaultName
          .split(" ")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ");
        catDoc = new Category({
          name: formattedName,
          slug: categoryInput.toLowerCase(),
          description: "",
          parent: null,
          icon: "book",
        });
        await catDoc.save();
      }
      categoryId = catDoc._id;
    }

    // Process tags if provided
    let tagArray = [];
    if (tags) {
      // Split tags by comma and trim whitespace
      tagArray = tags
        .split(",")
        .map((tag) => tag.trim().toLowerCase())
        .filter((tag) => tag.length > 0);

      // Limit to 10 tags max
      tagArray = tagArray.slice(0, 10);
    }

    // Log received data for debugging
    console.log("Received quiz data:", {
      title,
      description,
      category: categoryId,
      isPublic,
      tags: tagArray,
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

    // Normalize each question to match QuestionSchema
    const finalQuestions = parsedQuestions.map((q) => {
      const question = {
        questionText: q.text || q.questionText,
        questionType: q.type || q.questionType,
        options: Array.isArray(q.options)
          ? q.options.map((opt) => ({
              optionText: opt.text || opt.optionText,
              // pull from the frontend “correct” prop (fallback to opt.isCorrect)
              isCorrect: opt.correct ?? opt.isCorrect,
              matchTo: opt.matchTo,
              orderPosition: opt.orderPosition,
            }))
          : [],
        points: Number(q.points) || 10,
        timeLimit: q.timeLimit || 30,
      };
      if (q.questionImage) question.questionImage = q.questionImage;
      if (q.correctAnswer) question.correctAnswer = q.correctAnswer;
      if (q.blankAnswers) question.blankAnswers = q.blankAnswers;
      if (q.imageCoordinates) question.imageCoordinates = q.imageCoordinates;
      return question;
    });

    // Fix: Use either _id or id property from req.user
    const userId = req.user._id || req.user.id;

    // Create new quiz
    const newQuiz = new Quiz({
      title,
      description,
      category: categoryId,
      isPublic: isPublic === "true",
      creator: userId,
      questions: finalQuestions,
      tags: tagArray,
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
    if (!finalQuestions || finalQuestions.length === 0) {
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
      .populate("category", "name slug")
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
      .populate("category", "name slug")
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
    console.log("Raw form data:", req.body);

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      console.error("Quiz not found:", quizId);
      return res.status(404).render("error", {
        title: "Quiz Not Found",
        message: "The quiz you're looking for doesn't exist.",
      });
    }

    let answers = req.body.answers || {};
    console.log("Answers object keys:", Object.keys(answers));

    let parsedAnswers = [];
    let totalScore = 0;
    let maxPossibleScore = 0;

    quiz.questions.forEach((question, qIndex) => {
      try {
        maxPossibleScore += question.points;
        // Try both ID-keyed and index-keyed answers
        const rawAns = answers[question._id] ?? answers[qIndex];
        if (!rawAns) {
          console.warn(`⚠️ No answer for Q#${qIndex} (id=${question._id})`);
        }
        const supplied = Array.isArray(rawAns)
          ? rawAns
          : [rawAns].filter(Boolean);
        const selectedOptions = supplied.map(String);
        const correctOptionIds = question.options
          .filter((opt) => opt.isCorrect)
          .map((opt) => opt._id.toString());

        const isCorrect =
          selectedOptions.length === correctOptionIds.length &&
          selectedOptions
            .sort()
            .every((v, i) => v === correctOptionIds.sort()[i]);

        const answerRecord = {
          questionId: question._id,
          isCorrect,
          pointsAwarded: isCorrect ? question.points : 0,
          selectedOptions,
          textAnswer: Array.isArray(rawAns) ? "" : rawAns || "",
        };

        if (isCorrect) totalScore += question.points;
        parsedAnswers.push(answerRecord);
      } catch (qErr) {
        console.error(
          `Error in question #${qIndex} (id=${question._id}):`,
          qErr
        );
        throw qErr;
      }
    });

    console.log("Scored answers:", parsedAnswers);

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
    console.error("Error in postSubmit:", error);
    return res.status(500).render("error", {
      title: "Error processing submission",
      message: error.message,
      detail: error.stack,
    });
  }
};

// Add method to suggest tags
exports.getSuggestedTags = async (req, res) => {
  try {
    const query = req.query.q || "";

    if (query.length < 2) {
      return res.json([]);
    }

    // Find tags that match the query
    const tags = await Quiz.aggregate([
      { $unwind: "$tags" },
      { $match: { tags: { $regex: query, $options: "i" } } },
      { $group: { _id: "$tags", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    return res.json(tags.map((tag) => tag._id));
  } catch (error) {
    console.error("Error suggesting tags:", error);
    res.status(500).json({ error: "Failed to suggest tags" });
  }
};

// Add this new controller method
exports.authRequiredForQuiz = (req, res) => {
  const quizId = req.params.id;
  // Redirect to login with return URL to the quiz
  res.redirect(`/auth/login?returnTo=/quiz/${quizId}`);
};
