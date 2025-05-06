const jwt = require("jsonwebtoken");
const User = require("../models/User");

exports.isAuthenticated = async (req, res, next) => {
  try {
    // Check if user is already set in the request
    if (req.user) {
      return next();
    }

    // Get token from cookie
    const token = req.cookies.token;

    console.log("Auth middleware - Token present:", !!token);

    if (!token) {
      return res.status(401).render("error", {
        title: "Authentication Error",
        message: "You must be logged in to access this resource.",
      });
    }

    // Verify token
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("Token decoded:", decoded);

      // Find user by ID
      const user = await User.findById(decoded.id);

      if (!user) {
        return res.status(401).render("error", {
          title: "Authentication Error",
          message: "User not found. Please login again.",
        });
      }

      // Set user in request
      req.user = {
        _id: user._id,
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        role: user.role,
      };

      console.log(
        "User authenticated:",
        req.user.username,
        "Role:",
        req.user.role
      );
      next();
    } catch (error) {
      console.error("Token verification error:", error.message);
      res.status(401).render("error", {
        title: "Authentication Error",
        message: "Session expired. Please login again.",
      });
    }
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(500).render("error", {
      title: "Server Error",
      message: "An error occurred during authentication. Please try again.",
    });
  }
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
