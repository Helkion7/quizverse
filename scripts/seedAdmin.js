const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const mongoose = require("mongoose");
const argon2 = require("argon2");
const User = require("../models/User");

const seedAdmin = async () => {
  try {
    // Connect to MongoDB
    console.log("Connecting to MongoDB at:", process.env.MONGODB_URI);
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("Connected to MongoDB");

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ email: "admin@user.org" });

    if (existingAdmin) {
      console.log("Admin user already exists");
      return mongoose.connection.close();
    }

    // Hash the password
    const hashedPassword = await argon2.hash("Admin123!");

    // Create the admin user
    const adminUser = new User({
      username: "admin",
      email: "admin@user.org",
      password: hashedPassword,
      role: "admin",
    });

    await adminUser.save();

    console.log("Admin user created successfully:");
    console.log("Email: admin@user.org");
    console.log("Password: Admin123!");
    console.log("Role: admin");

    // Close the database connection
    mongoose.connection.close();
    console.log("MongoDB connection closed");
  } catch (error) {
    console.error("Error seeding admin user:", error);
    mongoose.connection.close();
    process.exit(1);
  }
};

// Run the seed function
seedAdmin();
