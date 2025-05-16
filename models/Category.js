const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const CategorySchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  description: {
    type: String,
    default: "",
  },
  parent: {
    type: Schema.Types.ObjectId,
    ref: "Category",
    default: null,
  },
  icon: {
    type: String,
    default: "book", // Default icon name
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Create index for faster querying
CategorySchema.index({ slug: 1 });

module.exports = mongoose.model("Category", CategorySchema);
