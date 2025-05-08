const argon2 = require("argon2");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Display login form
exports.getLogin = (req, res) => {
  if (req.user) {
    return res.redirect("/user/dashboard");
  }
  res.render("auth/login", { title: "Login", error: null });
};

// Process login
exports.postLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.render("auth/login", {
        title: "Login",
        error: "Please provide both email and password",
      });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.render("auth/login", {
        title: "Login",
        error: "Invalid email or password",
      });
    }

    // Verify password
    const validPassword = await argon2.verify(user.password, password);
    if (!validPassword) {
      return res.render("auth/login", {
        title: "Login",
        error: "Invalid email or password",
      });
    }

    // Create token with user ID and role
    const token = jwt.sign(
      {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // Set cookie with more secure options
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Only send over HTTPS in production
      maxAge: 24 * 60 * 60 * 1000, // 1 day
      sameSite: "lax", // Helps with CSRF protection
    });

    console.log("User logged in:", user.username, "Role:", user.role);

    // After successful login, check if there's a returnTo URL
    const returnTo = req.query.returnTo || "/user/dashboard";

    // Redirect based on role
    if (user.role === "admin") {
      return res.redirect("/admin/dashboard");
    } else {
      return res.redirect(returnTo);
    }
  } catch (error) {
    console.error("Login error:", error);
    res.render("auth/login", {
      title: "Login",
      error: "An error occurred during login",
    });
  }
};

// Display registration form
exports.getRegister = (req, res) => {
  if (req.user) {
    return res.redirect("/user/dashboard");
  }
  res.render("auth/register", { title: "Register", error: null });
};

// Process registration
exports.postRegister = async (req, res) => {
  try {
    const { username, email, password, confirmPassword } = req.body;

    // Validate input
    if (!username || !email || !password) {
      return res.render("auth/register", {
        title: "Register",
        error: "Please fill in all required fields",
      });
    }

    if (password !== confirmPassword) {
      return res.render("auth/register", {
        title: "Register",
        error: "Passwords do not match",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.render("auth/register", {
        title: "Register",
        error: "Username or email already in use",
      });
    }

    // Hash password
    const hashedPassword = await argon2.hash(password);

    // Create new user
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
    });

    await newUser.save();

    // Redirect to login page
    res.redirect("/auth/login?registered=true");
  } catch (error) {
    console.error("Registration error:", error);
    res.render("auth/register", {
      title: "Register",
      error: "An error occurred during registration",
    });
  }
};

// Process logout
exports.logout = (req, res) => {
  res.clearCookie("jwt");
  res.redirect("/auth/login");
};
