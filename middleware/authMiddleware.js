const jwt = require("jsonwebtoken");
const User = require("../models/User");

exports.isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  // Store the URL they were trying to access
  req.session.returnTo = req.originalUrl;
  // Redirect to login
  res.redirect("/auth/login");
};

exports.isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).render("error", {
      title: "Access Denied",
      message: "You do not have permission to access this resource.",
    });
  }
  next();
};
