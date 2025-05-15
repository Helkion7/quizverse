const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const path = require("path");
const dotenv = require("dotenv");
const http = require("http"); // Add HTTP module

// Import routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");
const quizRoutes = require("./routes/quizRoutes");
const staticRoutes = require("./routes/staticRoutes");
const leaderboardRoutes = require("./routes/leaderboardRoutes");

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Create HTTP server with Express app
const server = http.createServer(app);

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// Set up view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Replace session user middleware with JWT verification
app.use((req, res, next) => {
  const token = req.cookies.token;

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = decoded;
      res.locals.user = decoded;
    } catch (err) {
      console.error("JWT verification error:", err.message);
      res.locals.user = null;
      req.user = null;
    }
  } else {
    res.locals.user = null;
    req.user = null;
  }
  next();
});

// Routes
app.use("/auth", authRoutes);
app.use("/user", userRoutes);
app.use("/admin", adminRoutes);
app.use("/quiz", quizRoutes);
app.use("/leaderboard", leaderboardRoutes);
app.use("/", staticRoutes);

// Error handling middleware
app.use((req, res, next) => {
  res.status(404).render("error", {
    title: "Page Not Found",
    error: "Page not found",
    message: "The page you're looking for doesn't exist.",
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render("error", {
    title: "Server Error",
    error: "Something went wrong!",
    message: "Something went wrong on our end. Please try again later.",
  });
});

// Start the server (changed from app.listen to server.listen)
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
