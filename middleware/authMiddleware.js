const jwt = require("jsonwebtoken");

exports.isAuthenticated = (req, res, next) => {
  if (!req.user) {
    return res.redirect("/auth/login");
  }
  next();
};

exports.isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).render("error", {
      message: "You don't have permission to access this page",
    });
  }
  next();
};
