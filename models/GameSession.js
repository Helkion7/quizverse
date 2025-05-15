const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const PlayerSchema = new Schema({
  nickname: {
    type: String,
    required: true,
    trim: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: false, // Optional, in case of guest players
  },
  socketId: {
    type: String,
    required: false,
  },
  connected: {
    type: Boolean,
    default: true,
  },
  score: {
    type: Number,
    default: 0,
  },
  hasAnswered: {
    type: Boolean,
    default: false,
  },
  answers: [
    {
      questionIndex: Number,
      answer: Schema.Types.Mixed, // Can be String, ObjectId, or Array of ObjectIds
      timeElapsed: Number, // milliseconds taken to answer
      isCorrect: Boolean,
      pointsAwarded: Number,
    },
  ],
});

const GameSessionSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      minlength: 6,
      maxlength: 6,
    },
    quiz: {
      type: Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
    },
    hostId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["waiting", "in-progress", "completed"],
      default: "waiting",
    },
    players: [PlayerSchema],
    currentQuestionIndex: {
      type: Number,
      default: -1,
    },
    currentQuestionStartedAt: {
      type: Date,
    },
    startedAt: {
      type: Date,
    },
    endedAt: {
      type: Date,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 86400, // Automatically delete after 24 hours
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("GameSession", GameSessionSchema);
