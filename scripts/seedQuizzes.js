const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const mongoose = require("mongoose");
const Quiz = require("../models/Quiz");
const User = require("../models/User");

// Sample quiz data
const quizzes = [
  {
    title: "Web Development Fundamentals",
    description:
      "Test your knowledge of HTML, CSS, and JavaScript fundamentals",
    category: "web-development",
    isPublic: true,
    questions: [
      {
        questionText: "What does HTML stand for?",
        questionType: "multiple-choice",
        options: [
          { optionText: "Hyper Text Markup Language", isCorrect: true },
          { optionText: "Hyper Transfer Markup Language", isCorrect: false },
          { optionText: "High Tech Modern Language", isCorrect: false },
          { optionText: "Hyper Tool Multi Language", isCorrect: false },
        ],
        points: 10,
      },
      {
        questionText: "Which CSS property is used to change the text color?",
        questionType: "multiple-choice",
        options: [
          { optionText: "color", isCorrect: true },
          { optionText: "text-color", isCorrect: false },
          { optionText: "font-color", isCorrect: false },
          { optionText: "text-style", isCorrect: false },
        ],
        points: 10,
      },
      {
        questionText: "Which of the following is a JavaScript framework?",
        questionType: "multiple-choice",
        options: [
          { optionText: "Django", isCorrect: false },
          { optionText: "React", isCorrect: true },
          { optionText: "Flask", isCorrect: false },
          { optionText: "Sass", isCorrect: false },
        ],
        points: 10,
      },
      {
        questionText: "CSS is used for styling web pages.",
        questionType: "true-false",
        options: [
          { optionText: "True", isCorrect: true },
          { optionText: "False", isCorrect: false },
        ],
        points: 5,
      },
      {
        questionText: "What symbol is used to select elements by ID in CSS?",
        questionType: "short-answer",
        correctAnswer: "#",
        points: 15,
      },
      {
        questionText:
          "What method is used to add an element to the end of an array in JavaScript?",
        questionType: "short-answer",
        correctAnswer: "push",
        points: 15,
      },
      {
        questionText: "JavaScript is a statically typed language.",
        questionType: "true-false",
        options: [
          { optionText: "True", isCorrect: false },
          { optionText: "False", isCorrect: true },
        ],
        points: 5,
      },
      {
        questionText:
          "Which HTML tag is used to define an external JavaScript file?",
        questionType: "multiple-choice",
        options: [
          { optionText: "<javascript>", isCorrect: false },
          { optionText: "<script>", isCorrect: true },
          { optionText: "<js>", isCorrect: false },
          { optionText: "<code>", isCorrect: false },
        ],
        points: 10,
      },
    ],
  },
  {
    title: "Programming Concepts",
    description: "Test your understanding of basic programming concepts",
    category: "programming",
    isPublic: true,
    questions: [
      {
        questionText: "What is a variable?",
        questionType: "multiple-choice",
        options: [
          {
            optionText: "A container for storing data values",
            isCorrect: true,
          },
          { optionText: "A type of function", isCorrect: false },
          { optionText: "A mathematical operation", isCorrect: false },
          { optionText: "A programming language", isCorrect: false },
        ],
        points: 10,
      },
      {
        questionText: "What does OOP stand for?",
        questionType: "short-answer",
        correctAnswer: "Object Oriented Programming",
        points: 15,
      },
      {
        questionText: "Arrays in programming always have a fixed size.",
        questionType: "true-false",
        options: [
          { optionText: "True", isCorrect: false },
          { optionText: "False", isCorrect: true },
        ],
        points: 5,
      },
      {
        questionText: "Which of the following is not a programming paradigm?",
        questionType: "multiple-choice",
        options: [
          { optionText: "Functional", isCorrect: false },
          { optionText: "Object-Oriented", isCorrect: false },
          { optionText: "Procedural", isCorrect: false },
          { optionText: "Diagrammatic", isCorrect: true },
        ],
        points: 10,
      },
      {
        questionText: "What is recursion in programming?",
        questionType: "multiple-choice",
        options: [
          { optionText: "A function that calls itself", isCorrect: true },
          { optionText: "A loop that never ends", isCorrect: false },
          { optionText: "A type of data structure", isCorrect: false },
          { optionText: "A compilation error", isCorrect: false },
        ],
        points: 15,
      },
      {
        questionText: "What is the time complexity of binary search?",
        questionType: "multiple-choice",
        options: [
          { optionText: "O(1)", isCorrect: false },
          { optionText: "O(n)", isCorrect: false },
          { optionText: "O(log n)", isCorrect: true },
          { optionText: "O(n log n)", isCorrect: false },
        ],
        points: 20,
      },
      {
        questionText: "Boolean values can only be true or false.",
        questionType: "true-false",
        options: [
          { optionText: "True", isCorrect: true },
          { optionText: "False", isCorrect: false },
        ],
        points: 5,
      },
      {
        questionText: "What is the result of 5 + '5' in JavaScript?",
        questionType: "short-answer",
        correctAnswer: "55",
        points: 10,
      },
    ],
  },
  {
    title: "Database Fundamentals",
    description: "Test your knowledge of database concepts and SQL",
    category: "databases",
    isPublic: true,
    questions: [
      {
        questionText: "What does SQL stand for?",
        questionType: "multiple-choice",
        options: [
          { optionText: "Structured Query Language", isCorrect: true },
          { optionText: "Simple Query Language", isCorrect: false },
          { optionText: "Standard Question Language", isCorrect: false },
          { optionText: "System Quality Language", isCorrect: false },
        ],
        points: 10,
      },
      {
        questionText: "MongoDB is a relational database.",
        questionType: "true-false",
        options: [
          { optionText: "True", isCorrect: false },
          { optionText: "False", isCorrect: true },
        ],
        points: 5,
      },
      {
        questionText:
          "Which SQL command is used to extract data from a database?",
        questionType: "multiple-choice",
        options: [
          { optionText: "EXTRACT", isCorrect: false },
          { optionText: "SELECT", isCorrect: true },
          { optionText: "OBTAIN", isCorrect: false },
          { optionText: "GET", isCorrect: false },
        ],
        points: 10,
      },
      {
        questionText: "What is a primary key?",
        questionType: "multiple-choice",
        options: [
          { optionText: "The first column in a table", isCorrect: false },
          { optionText: "A key that opens the database", isCorrect: false },
          {
            optionText: "A field that uniquely identifies each record",
            isCorrect: true,
          },
          {
            optionText: "The main password for the database",
            isCorrect: false,
          },
        ],
        points: 10,
      },
      {
        questionText: "In SQL, which keyword is used to sort the result-set?",
        questionType: "short-answer",
        correctAnswer: "ORDER BY",
        points: 15,
      },
      {
        questionText:
          "What is the term for organizing data into related tables?",
        questionType: "short-answer",
        correctAnswer: "normalization",
        points: 15,
      },
      {
        questionText:
          "ACID is a set of properties that guarantee database transactions are processed reliably.",
        questionType: "true-false",
        options: [
          { optionText: "True", isCorrect: true },
          { optionText: "False", isCorrect: false },
        ],
        points: 5,
      },
      {
        questionText: "Which of these is not a common NoSQL database type?",
        questionType: "multiple-choice",
        options: [
          { optionText: "Document store", isCorrect: false },
          { optionText: "Key-value store", isCorrect: false },
          { optionText: "Row-attribute store", isCorrect: true },
          { optionText: "Graph database", isCorrect: false },
        ],
        points: 10,
      },
    ],
  },
  {
    title: "Cybersecurity Basics",
    description: "Test your knowledge of basic cybersecurity concepts",
    category: "cybersecurity",
    isPublic: true,
    questions: [
      {
        questionText: "What is phishing?",
        questionType: "multiple-choice",
        options: [
          { optionText: "A type of computer virus", isCorrect: false },
          {
            optionText: "A fraudulent attempt to obtain sensitive information",
            isCorrect: true,
          },
          { optionText: "A secure communication protocol", isCorrect: false },
          { optionText: "A method of encrypting data", isCorrect: false },
        ],
        points: 10,
      },
      {
        questionText: "What does SSL stand for?",
        questionType: "short-answer",
        correctAnswer: "Secure Sockets Layer",
        points: 15,
      },
      {
        questionText:
          "Two-factor authentication provides better security than a password alone.",
        questionType: "true-false",
        options: [
          { optionText: "True", isCorrect: true },
          { optionText: "False", isCorrect: false },
        ],
        points: 5,
      },
      {
        questionText:
          "Which of the following is not a common method of cyber attack?",
        questionType: "multiple-choice",
        options: [
          { optionText: "DDoS", isCorrect: false },
          { optionText: "SQL Injection", isCorrect: false },
          { optionText: "Man-in-the-middle", isCorrect: false },
          { optionText: "Safe Browsing Attack", isCorrect: true },
        ],
        points: 10,
      },
      {
        questionText:
          "What type of malware locks your files and demands payment to unlock them?",
        questionType: "multiple-choice",
        options: [
          { optionText: "Worm", isCorrect: false },
          { optionText: "Trojan", isCorrect: false },
          { optionText: "Ransomware", isCorrect: true },
          { optionText: "Spyware", isCorrect: false },
        ],
        points: 10,
      },
      {
        questionText: "What is a firewall?",
        questionType: "multiple-choice",
        options: [
          {
            optionText: "A physical barrier around your computer",
            isCorrect: false,
          },
          {
            optionText:
              "A security system that monitors and controls network traffic",
            isCorrect: true,
          },
          { optionText: "A backup system for data", isCorrect: false },
          { optionText: "A type of antivirus software", isCorrect: false },
        ],
        points: 10,
      },
      {
        questionText:
          "What is the process of converting plaintext into coded form called?",
        questionType: "short-answer",
        correctAnswer: "encryption",
        points: 10,
      },
      {
        questionText:
          "Biometric authentication can include fingerprint scanning.",
        questionType: "true-false",
        options: [
          { optionText: "True", isCorrect: true },
          { optionText: "False", isCorrect: false },
        ],
        points: 5,
      },
    ],
  },
  {
    title: "Networking Basics",
    description: "Test your knowledge of computer networking concepts",
    category: "networking",
    isPublic: true,
    questions: [
      {
        questionText: "What does IP stand for in IP address?",
        questionType: "multiple-choice",
        options: [
          { optionText: "Internet Protocol", isCorrect: true },
          { optionText: "Internet Provider", isCorrect: false },
          { optionText: "Internet Port", isCorrect: false },
          { optionText: "Internal Process", isCorrect: false },
        ],
        points: 10,
      },
      {
        questionText:
          "Which layer of the OSI model is responsible for routing?",
        questionType: "multiple-choice",
        options: [
          { optionText: "Physical", isCorrect: false },
          { optionText: "Data Link", isCorrect: false },
          { optionText: "Network", isCorrect: true },
          { optionText: "Transport", isCorrect: false },
        ],
        points: 15,
      },
      {
        questionText: "What is the default port number for HTTP?",
        questionType: "short-answer",
        correctAnswer: "80",
        points: 10,
      },
      {
        questionText: "HTTPS is more secure than HTTP.",
        questionType: "true-false",
        options: [
          { optionText: "True", isCorrect: true },
          { optionText: "False", isCorrect: false },
        ],
        points: 5,
      },
      {
        questionText: "What device connects different networks together?",
        questionType: "multiple-choice",
        options: [
          { optionText: "Hub", isCorrect: false },
          { optionText: "Switch", isCorrect: false },
          { optionText: "Router", isCorrect: true },
          { optionText: "Modem", isCorrect: false },
        ],
        points: 10,
      },
      {
        questionText: "What does DNS stand for?",
        questionType: "short-answer",
        correctAnswer: "Domain Name System",
        points: 10,
      },
      {
        questionText: "Which protocol is used for sending emails?",
        questionType: "multiple-choice",
        options: [
          { optionText: "HTTP", isCorrect: false },
          { optionText: "FTP", isCorrect: false },
          { optionText: "SMTP", isCorrect: true },
          { optionText: "SSH", isCorrect: false },
        ],
        points: 10,
      },
      {
        questionText:
          "A subnet mask is used to determine which portion of an IP address is the network address.",
        questionType: "true-false",
        options: [
          { optionText: "True", isCorrect: true },
          { optionText: "False", isCorrect: false },
        ],
        points: 5,
      },
    ],
  },
];

const seedQuizzes = async () => {
  try {
    // Connect to MongoDB
    console.log("Connecting to MongoDB at:", process.env.MONGODB_URI);
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB");

    // Find admin user to set as creator
    const admin = await User.findOne({ role: "admin" });

    if (!admin) {
      console.error("No admin user found. Please run seedAdmin.js first.");
      return mongoose.connection.close();
    }

    // Clear existing quizzes
    await Quiz.deleteMany({});
    console.log("Cleared existing quizzes");

    // Create quizzes
    let createdCount = 0;
    for (const quizData of quizzes) {
      const quiz = new Quiz({
        ...quizData,
        creator: admin._id,
      });

      await quiz.save();

      // Add quiz to admin's created quizzes
      await User.findByIdAndUpdate(admin._id, {
        $push: { createdQuizzes: quiz._id },
      });

      createdCount++;
      console.log(`Created quiz: ${quiz.title}`);
    }

    console.log(`Successfully created ${createdCount} sample quizzes`);
    console.log("Quiz seed completed successfully");

    // Close MongoDB connection
    mongoose.connection.close();
    console.log("MongoDB connection closed");
  } catch (error) {
    console.error("Error seeding quizzes:", error);
    mongoose.connection.close();
    process.exit(1);
  }
};

// Run the seed function
seedQuizzes();
