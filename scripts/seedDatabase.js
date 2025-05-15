require("dotenv").config();
const mongoose = require("mongoose");
const argon2 = require("argon2");
const User = require("../models/User");
const Quiz = require("../models/Quiz");
const QuizAttempt = require("../models/QuizAttempt");

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

// User data
const adminUser = {
  username: "admin",
  email: "admin@quizverse.no",
  password: "admin123", // This will be hashed
  role: "admin",
};

const regularUsers = [
  { username: "alice", email: "alice@example.com", password: "password123" },
  { username: "bob", email: "bob@example.com", password: "password123" },
  {
    username: "charlie",
    email: "charlie@example.com",
    password: "password123",
  },
  { username: "diana", email: "diana@example.com", password: "password123" },
  { username: "erik", email: "erik@example.com", password: "password123" },
];

// Quiz data for Norwegian IT school program areas
const quizzes = [
  {
    title: "Utvikling Quiz",
    description: "Test din kunnskap om programvareutvikling",
    category: "programming",
    isPublic: true,
    questions: [
      {
        questionText: "Hva er hovedmålet med programfaget Utvikling?",
        questionType: "multiple-choice",
        options: [
          { optionText: "Å lære om nettverksdrift", isCorrect: false },
          {
            optionText:
              "Å få praktisk erfaring med programmering og systemdesign",
            isCorrect: true,
          },
          { optionText: "Å lære om brukergrensesnittstøtte", isCorrect: false },
          { optionText: "Å administrere serverparker", isCorrect: false },
        ],
        points: 10,
      },
      {
        questionText:
          "Hvilket programmeringsspråk nevnes spesifikt som eksempel i beskrivelsen av programfaget Utvikling?",
        questionType: "multiple-choice",
        options: [
          { optionText: "Java", isCorrect: false },
          { optionText: "Python", isCorrect: false },
          { optionText: "C#", isCorrect: false },
          { optionText: "JavaScript", isCorrect: true },
        ],
        points: 10,
      },
      {
        questionText:
          "Hva skal elevene planlegge, gjennomføre og dokumentere i programfaget Utvikling?",
        questionType: "multiple-choice",
        options: [
          { optionText: "Serverinstallasjoner", isCorrect: false },
          { optionText: "Brukerstøttesaker", isCorrect: false },
          { optionText: "Programvareprosjekter", isCorrect: true },
          { optionText: "Nettverksinfrastruktur", isCorrect: false },
        ],
        points: 10,
      },
      {
        questionText:
          "Hvilket verktøy er viktig i utviklingsprosessen ifølge kompetansemålene?",
        questionType: "multiple-choice",
        options: [
          { optionText: "Prosjektstyringsverktøy", isCorrect: true },
          { optionText: "Antivirusprogrammer", isCorrect: false },
          { optionText: "Skrivebordsdeling", isCorrect: false },
          { optionText: "Serverovervåkning", isCorrect: false },
        ],
        points: 10,
      },
      {
        questionText:
          "Hvilket tema innen informasjonssikkerhet skal elevene lære om i programfaget Utvikling?",
        questionType: "multiple-choice",
        options: [
          { optionText: "Serverbrannvegger", isCorrect: false },
          { optionText: "Personvern i utviklingsprosessen", isCorrect: true },
          { optionText: "Fysisk sikkerhet", isCorrect: false },
          { optionText: "Kryptering av harddisker", isCorrect: false },
        ],
        points: 10,
      },
    ],
  },
  {
    title: "Driftsstøtte Quiz",
    description: "Test din kunnskap om IT-infrastruktur og driftsstøtte",
    category: "networking",
    isPublic: true,
    questions: [
      {
        questionText: "Hva fokuserer programfaget Driftsstøtte på?",
        questionType: "multiple-choice",
        options: [
          { optionText: "Programmering og systemdesign", isCorrect: false },
          { optionText: "Brukerstøtte og kommunikasjon", isCorrect: false },
          {
            optionText: "Installasjon og vedlikehold av IT-infrastruktur",
            isCorrect: true,
          },
          { optionText: "Webdesign og grafisk utforming", isCorrect: false },
        ],
        points: 10,
      },
      {
        questionText:
          "Hvilke systemer skal elevene lære å administrere i Driftsstøtte?",
        questionType: "multiple-choice",
        options: [
          { optionText: "Brukerkontoer og tilganger", isCorrect: true },
          { optionText: "Sosiale medier", isCorrect: false },
          { optionText: "Designprogrammer", isCorrect: false },
          { optionText: "Publiseringsverktøy", isCorrect: false },
        ],
        points: 10,
      },
      {
        questionText:
          "Hvilket av følgende elementer inngår i IT-infrastruktur som dekkes i Driftsstøtte?",
        questionType: "multiple-choice",
        options: [
          { optionText: "Programkode", isCorrect: false },
          { optionText: "Nettverk", isCorrect: true },
          { optionText: "Brukergrensesnitt", isCorrect: false },
          { optionText: "Applikasjonslogikk", isCorrect: false },
        ],
        points: 10,
      },
      {
        questionText:
          "Hva er en viktig del av Driftsstøtte når det gjelder driftsforstyrrelser?",
        questionType: "multiple-choice",
        options: [
          { optionText: "Å lage nye programvareløsninger", isCorrect: false },
          { optionText: "Å kommunisere med brukere", isCorrect: false },
          {
            optionText: "Å iverksette tiltak mot driftsforstyrrelser",
            isCorrect: true,
          },
          { optionText: "Å redesigne brukergrensesnitt", isCorrect: false },
        ],
        points: 10,
      },
      {
        questionText:
          "Hvilke sikkerhetsmekanismer skal implementeres ifølge kompetansemålene for Driftsstøtte?",
        questionType: "multiple-choice",
        options: [
          {
            optionText: "Mekanismer som beskytter mot inntrenging og datatap",
            isCorrect: true,
          },
          { optionText: "Mekanismer for brukeropplæring", isCorrect: false },
          {
            optionText: "Mekanismer for programvareutvikling",
            isCorrect: false,
          },
          { optionText: "Mekanismer for markedsføring", isCorrect: false },
        ],
        points: 10,
      },
    ],
  },
  {
    title: "Brukerstøtte Quiz",
    description: "Test din kunnskap om brukerstøtte og kommunikasjon",
    category: "other",
    isPublic: true,
    questions: [
      {
        questionText: "Hva lærer elevene i programfaget Brukerstøtte?",
        questionType: "multiple-choice",
        options: [
          {
            optionText: "Å programmere avanserte applikasjoner",
            isCorrect: false,
          },
          { optionText: "Å konfigurere servere og nettverk", isCorrect: false },
          {
            optionText: "Å kommunisere effektivt med brukere",
            isCorrect: true,
          },
          { optionText: "Å designe databaser", isCorrect: false },
        ],
        points: 10,
      },
      {
        questionText: "Hvilke behov skal kartlegges i Brukerstøtte?",
        questionType: "multiple-choice",
        options: [
          { optionText: "Utviklernes behov", isCorrect: false },
          { optionText: "Brukernes behov", isCorrect: true },
          { optionText: "Systemets behov", isCorrect: false },
          { optionText: "Ledelsens behov", isCorrect: false },
        ],
        points: 10,
      },
      {
        questionText:
          "Hva skal elevene bidra til ifølge kompetansemålene i Brukerstøtte?",
        questionType: "multiple-choice",
        options: [
          { optionText: "Utvikling av ny programvare", isCorrect: false },
          {
            optionText: "Opplæring og veiledning av brukerne",
            isCorrect: true,
          },
          { optionText: "Installasjon av servere", isCorrect: false },
          { optionText: "Konfigurering av nettverk", isCorrect: false },
        ],
        points: 10,
      },
      {
        questionText: "Hvilke rutiner skal bygges i Brukerstøttefaget?",
        questionType: "multiple-choice",
        options: [
          { optionText: "Rutiner for programutvikling", isCorrect: false },
          { optionText: "Rutiner for servervedlikehold", isCorrect: false },
          {
            optionText: "Rutiner for feilhåndtering og eskalering",
            isCorrect: true,
          },
          { optionText: "Rutiner for markedsføring", isCorrect: false },
        ],
        points: 10,
      },
      {
        questionText:
          "Hvordan skal brukerstøtteoppgaver dokumenteres ifølge kompetansemålene?",
        questionType: "multiple-choice",
        options: [
          { optionText: "Gjennom sosiale medier", isCorrect: false },
          { optionText: "Gjennom muntlige presentasjoner", isCorrect: false },
          {
            optionText: "Gjennom planlegging, gjennomføring og vurdering",
            isCorrect: true,
          },
          { optionText: "Gjennom kildekode", isCorrect: false },
        ],
        points: 10,
      },
    ],
  },
];

// Function to seed the database
const seedDatabase = async () => {
  try {
    // Clear existing data
    await User.deleteMany({});
    await Quiz.deleteMany({});
    await QuizAttempt.deleteMany({});

    console.log("Existing data cleared");

    // Create admin user
    const hashedAdminPassword = await argon2.hash(adminUser.password);
    const newAdmin = new User({
      ...adminUser,
      password: hashedAdminPassword,
    });
    const savedAdmin = await newAdmin.save();
    console.log(`Admin user created: ${savedAdmin.username}`);

    // Create regular users
    const createdUsers = [];
    for (const user of regularUsers) {
      const hashedPassword = await argon2.hash(user.password);
      const newUser = new User({
        ...user,
        password: hashedPassword,
        role: "user",
      });
      const savedUser = await newUser.save();
      createdUsers.push(savedUser);
      console.log(`Regular user created: ${savedUser.username}`);
    }

    // Create quizzes
    const createdQuizzes = [];
    for (const quiz of quizzes) {
      const newQuiz = new Quiz({
        ...quiz,
        creator: savedAdmin._id,
      });
      const savedQuiz = await newQuiz.save();
      createdQuizzes.push(savedQuiz);

      // Add quiz to admin's created quizzes
      await User.findByIdAndUpdate(savedAdmin._id, {
        $push: { createdQuizzes: savedQuiz._id },
      });

      console.log(`Quiz created: ${savedQuiz.title}`);
    }

    // Create quiz attempts for regular users
    for (const user of createdUsers) {
      // Each user attempts each quiz with varying completion rates
      for (const quiz of createdQuizzes) {
        // Randomly determine if user completed the quiz
        const completed = Math.random() > 0.2; // 80% chance quiz was completed

        if (completed) {
          // Generate random answers and score
          const answers = [];
          let totalScore = 0;
          let maxPossibleScore = 0;

          quiz.questions.forEach((question) => {
            maxPossibleScore += question.points;

            // Simulate answering (70% chance of getting it right)
            const isCorrect = Math.random() > 0.3;
            let pointsAwarded = 0;

            if (isCorrect) {
              pointsAwarded = question.points;
              totalScore += pointsAwarded;
            }

            // Find correct option for simulation
            let correctOptionId;
            let incorrectOptionId;

            if (question.options && question.options.length > 0) {
              const correctOption = question.options.find(
                (opt) => opt.isCorrect
              );
              const incorrectOption = question.options.find(
                (opt) => !opt.isCorrect
              );

              if (correctOption) correctOptionId = correctOption._id;
              if (incorrectOption) incorrectOptionId = incorrectOption._id;
            }

            answers.push({
              questionId: question._id,
              isCorrect: isCorrect,
              pointsAwarded: pointsAwarded,
              selectedOptions: isCorrect
                ? [correctOptionId]
                : [incorrectOptionId],
              textAnswer:
                question.questionType === "short-answer"
                  ? isCorrect
                    ? question.correctAnswer
                    : "Wrong answer"
                  : "",
            });
          });

          const percentageScore = (totalScore / maxPossibleScore) * 100;

          // Create the attempt with a random date in the last 30 days
          const attempt = new QuizAttempt({
            quiz: quiz._id,
            user: user._id,
            answers: answers,
            totalScore: totalScore,
            maxPossibleScore: maxPossibleScore,
            percentageScore: percentageScore,
            completed: true,
            completedAt: new Date(
              Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000
            ),
          });

          const savedAttempt = await attempt.save();

          // Add attempt to user's attempted quizzes
          await User.findByIdAndUpdate(user._id, {
            $push: { attemptedQuizzes: savedAttempt._id },
          });

          // Increment quiz attempts counter
          await Quiz.findByIdAndUpdate(quiz._id, {
            $inc: { attempts: 1 },
          });

          console.log(
            `Quiz attempt created for ${user.username} on ${
              quiz.title
            }: ${percentageScore.toFixed(2)}%`
          );
        }
      }
    }

    console.log("Database seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  } finally {
    // Disconnect from MongoDB
    mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
};

// Run the seeding function
connectDB().then(() => {
  seedDatabase();
});
