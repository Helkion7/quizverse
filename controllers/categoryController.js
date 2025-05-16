const Category = require("../models/Category");
const Quiz = require("../models/Quiz");

// Get all categories
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.render("categories/browse", {
      title: "Browse Categories",
      categories,
      user: req.user,
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).render("error", {
      title: "Error",
      message: "Failed to load categories.",
    });
  }
};

// Get quizzes by category
exports.getQuizzesByCategory = async (req, res) => {
  try {
    const categorySlug = req.params.slug;
    const category = await Category.findOne({ slug: categorySlug });

    if (!category) {
      return res.status(404).render("error", {
        title: "Category Not Found",
        message: "The category you are looking for does not exist.",
      });
    }

    // Find quizzes with this category
    const quizzes = await Quiz.find({
      category: category._id,
      isPublic: true,
    })
      .populate("creator", "username")
      .sort({ createdAt: -1 });

    res.render("categories/quizzes", {
      title: `${category.name} Quizzes`,
      category,
      quizzes,
      user: req.user,
    });
  } catch (error) {
    console.error("Error fetching category quizzes:", error);
    res.status(500).render("error", {
      title: "Error",
      message: "Failed to load quizzes for this category.",
    });
  }
};

// Get tag cloud data
exports.getTagCloud = async (req, res) => {
  try {
    // Aggregate to get top tags and their counts
    const tagData = await Quiz.aggregate([
      { $match: { isPublic: true } },
      { $unwind: "$tags" },
      { $group: { _id: "$tags", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 50 }, // Limit to top 50 tags
    ]);

    res.render("categories/tags", {
      title: "Tag Cloud",
      tags: tagData,
      user: req.user,
    });
  } catch (error) {
    console.error("Error fetching tag cloud:", error);
    res.status(500).render("error", {
      title: "Error",
      message: "Failed to load tag cloud data.",
    });
  }
};

// Get quizzes by tag
exports.getQuizzesByTag = async (req, res) => {
  try {
    const tag = req.params.tag;

    // Find quizzes with this tag
    const quizzes = await Quiz.find({
      tags: tag,
      isPublic: true,
    })
      .populate("creator", "username")
      .sort({ createdAt: -1 });

    res.render("categories/tag-quizzes", {
      title: `Quizzes tagged with "${tag}"`,
      tag,
      quizzes,
      user: req.user,
    });
  } catch (error) {
    console.error("Error fetching tag quizzes:", error);
    res.status(500).render("error", {
      title: "Error",
      message: "Failed to load quizzes for this tag.",
    });
  }
};

// Admin functions for category management
exports.getAdminCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.render("admin/categories", {
      title: "Manage Categories",
      categories,
      user: req.user,
    });
  } catch (error) {
    console.error("Error in admin categories:", error);
    res.status(500).render("error", {
      title: "Error",
      message: "Failed to load category management.",
    });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { name, description, parent, icon } = req.body;

    // Create slug from name
    const slug = name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w-]+/g, "");

    const newCategory = new Category({
      name,
      slug,
      description,
      parent: parent || null,
      icon: icon || "book",
    });

    await newCategory.save();
    req.flash("success_msg", "Category created successfully");
    res.redirect("/admin/categories");
  } catch (error) {
    console.error("Error creating category:", error);
    req.flash("error_msg", "Failed to create category");
    res.redirect("/admin/categories");
  }
};
