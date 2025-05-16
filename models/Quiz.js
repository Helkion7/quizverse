const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const QuestionSchema = new Schema({
  questionText: {
    type: String,
    required: true,
  },
  questionImage: {
    type: String,
    default: "",
  },
  questionType: {
    type: String,
    enum: [
      "multiple-choice",
      "true-false",
      "short-answer",
      "matching",
      "ordering",
      "fill-in-blanks",
      "image-selection",
    ],
    default: "multiple-choice",
  },
  options: [
    {
      optionText: String,
      isCorrect: Boolean,
      matchTo: String, // For matching questions
      orderPosition: Number, // For ordering questions
    },
  ],
  correctAnswer: {
    type: String,
    required: function () {
      return this.questionType === "short-answer";
    },
  },
  blankAnswers: [String], // For fill-in-the-blanks questions
  imageCoordinates: [
    // For image-selection questions
    {
      x: Number,
      y: Number,
      width: Number,
      height: Number,
      label: String,
    },
  ],
  points: {
    type: Number,
    default: 10,
  },
  timeLimit: {
    type: Number,
    default: 30, // in seconds
    min: 5,
    max: 300,
  },
});

const QuizSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    default: "",
  },
  coverImage: {
    type: String,
    default: "",
  },
  creator: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  // Updated category field to reference Category model
  category: {
    type: Schema.Types.ObjectId,
    ref: "Category",
    required: true,
  },
  // Legacy category field (for backward compatibility)
  categoryLegacy: {
    type: String,
    enum: [
      "programming",
      "networking",
      "databases",
      "cybersecurity",
      "web-development",
      "other",
    ],
    default: "other",
  },
  questions: [QuestionSchema],
  isPublic: {
    type: Boolean,
    default: true,
  },
  tags: [
    {
      type: String,
      lowercase: true,
      trim: true,
    },
  ],
  // For faster tag filtering and suggestions
  tagsCount: {
    type: Map,
    of: Number,
    default: {},
  },
  attempts: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

QuizSchema.pre("save", function (next) {
  this.updatedAt = Date.now();

  // Update tags count
  if (this.isModified("tags")) {
    this.tagsCount = new Map();
    this.tags.forEach((tag) => {
      this.tagsCount.set(tag, (this.tagsCount.get(tag) || 0) + 1);
    });
  }

  next();
});

// Add index for tag and category queries
QuizSchema.index({ tags: 1 });
QuizSchema.index({ category: 1 });

module.exports = mongoose.model("Quiz", QuizSchema);
