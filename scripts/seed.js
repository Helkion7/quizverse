require("dotenv").config();
const mongoose = require("mongoose");
const argon2 = require("argon2");
const User = require("../models/User");
const Quiz = require("../models/Quiz");
const Category = require("../models/Category");

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  // Clear collections
  await Promise.all([
    User.deleteMany({}),
    Quiz.deleteMany({}),
    Category.deleteMany({}),
  ]);

  // 1) Create categories
  const catData = ["Brukerstøtte", "Utvikling", "Driftsstøtte"];
  const categories = await Category.insertMany(
    catData.map((name) => ({
      name,
      slug: name.toLowerCase().replace(/\s+/, ""),
    }))
  );

  // 2) Create users
  const pwHash = await argon2.hash("password123");
  const admin = new User({
    username: "admin",
    email: "admin@quizverse.test",
    password: pwHash,
    role: "admin",
  });
  const users = [];
  for (let i = 1; i <= 5; i++) {
    users.push(
      new User({
        username: `user${i}`,
        email: `user${i}@quizverse.test`,
        password: pwHash,
      })
    );
  }
  await Promise.all([admin.save(), ...users.map((u) => u.save())]);

  // 3) Create quizzes
  const quizzes = [];

  // Brukerstøtte quiz
  quizzes.push(
    new Quiz({
      title: "Brukerstøtte",
      description: "Etisk veiledning og feilsøking",
      creator: admin._id,
      category: categories[0]._id,
      categoryLegacy: "brukerstøtte",
      questions: [
        {
          questionText:
            "Hvilket rammeverk brukes ofte for kvalitetssikring av IT-drift?",
          questionType: "multiple-choice",
          options: [
            { optionText: "ITIL", isCorrect: true },
            { optionText: "Agile", isCorrect: false },
            { optionText: "SCRUM", isCorrect: false },
            { optionText: "V-Model", isCorrect: false },
          ],
        },
        {
          questionText: "Brukerstøtte må følge GDPR-regelverk.",
          questionType: "true-false",
          options: [
            { optionText: "True", isCorrect: true },
            { optionText: "False", isCorrect: false },
          ],
        },
        {
          questionText:
            "Nevn én metode for å håndtere krevende brukersituasjoner.",
          questionType: "short-answer",
          correctAnswer: "Aktiv lytting",
        },
        {
          questionText: "Feilretting krever ofte …",
          questionType: "fill-in-blanks",
          blankAnswers: ["systemanalyse", "logganalyse"],
        },
        {
          questionText: "Hvilket verktøy brukes for fjernadministrasjon?",
          questionType: "multiple-choice",
          options: [
            { optionText: "SSH", isCorrect: true },
            { optionText: "FTP", isCorrect: false },
            { optionText: "SMTP", isCorrect: false },
            { optionText: "DNS", isCorrect: false },
          ],
        },
        {
          questionText: "Brukerstøtte handler om empati.",
          questionType: "true-false",
          options: [
            { optionText: "True", isCorrect: true },
            { optionText: "False", isCorrect: false },
          ],
        },
        {
          questionText: "Nevn en nøkkelkomponent i kontinuerlig forbedring.",
          questionType: "short-answer",
          correctAnswer: "Kaizen",
        },
        {
          questionText: "En viktig faktor i feilsøking er …",
          questionType: "fill-in-blanks",
          blankAnswers: ["logganalyse", "monitorering"],
        },
        {
          questionText: "Ordne støttefaser:",
          questionType: "ordering",
          options: [
            { optionText: "Identifisering", orderPosition: 1 },
            { optionText: "Analyse", orderPosition: 2 },
            { optionText: "Løsing", orderPosition: 3 },
          ],
        },
        {
          questionText: "Marker området for brukergrensesnittet.",
          questionType: "image-selection",
          imageCoordinates: [
            { x: 5, y: 5, width: 100, height: 50, label: "UI" },
          ],
        },
      ],
    })
  );

  // Utvikling quiz
  quizzes.push(
    new Quiz({
      title: "Utvikling",
      description: "Programmering, databaser og sikkerhet",
      creator: admin._id,
      category: categories[1]._id,
      categoryLegacy: "utvikling",
      questions: [
        {
          questionText: "Hvilket språk er best egnet for web backend?",
          questionType: "multiple-choice",
          options: [
            { optionText: "JavaScript/Node.js", isCorrect: true },
            { optionText: "HTML", isCorrect: false },
            { optionText: "CSS", isCorrect: false },
            { optionText: "Markdown", isCorrect: false },
          ],
        },
        {
          questionText:
            "SQL brukes til å modellere og hente data fra databaser.",
          questionType: "true-false",
          options: [
            { optionText: "True", isCorrect: true },
            { optionText: "False", isCorrect: false },
          ],
        },
        {
          questionText: "Sorter faser i et standard utviklingsløp:",
          questionType: "ordering",
          options: [
            { optionText: "Testing", orderPosition: 3 },
            { optionText: "Design", orderPosition: 2 },
            { optionText: "Kravspesifikasjon", orderPosition: 1 },
            { optionText: "Deploy", orderPosition: 4 },
          ],
        },
        {
          questionText: "Hva står API for?",
          questionType: "short-answer",
          correctAnswer: "Application Programming Interface",
        },
        {
          questionText: "CSS brukes for å style nettsider.",
          questionType: "true-false",
          options: [
            { optionText: "True", isCorrect: true },
            { optionText: "False", isCorrect: false },
          ],
        },
        {
          questionText: "Hvilket rammeverk bruker komponentbasert UI?",
          questionType: "multiple-choice",
          options: [
            { optionText: "React", isCorrect: true },
            { optionText: "jQuery", isCorrect: false },
            { optionText: "Bootstrap", isCorrect: false },
            { optionText: "Vuex", isCorrect: false },
          ],
        },
        {
          questionText: "Sorter utviklingsmodeller:",
          questionType: "ordering",
          options: [
            { optionText: "Waterfall", orderPosition: 1 },
            { optionText: "Agile", orderPosition: 2 },
            { optionText: "DevOps", orderPosition: 3 },
          ],
        },
        {
          questionText: "Definer continuous integration.",
          questionType: "short-answer",
          correctAnswer: "Automatisert bygging og testing",
        },
        {
          questionText: "Match språk med paradigme:",
          questionType: "matching",
          options: [
            { optionText: "Haskell", matchTo: "Functional" },
            { optionText: "Java", matchTo: "Object-Oriented" },
            { optionText: "C", matchTo: "Procedural" },
          ],
        },
        {
          questionText: "Velg område for databaseikon.",
          questionType: "image-selection",
          imageCoordinates: [
            { x: 10, y: 10, width: 40, height: 40, label: "Database" },
          ],
        },
      ],
    })
  );

  // Driftsstøtte quiz
  quizzes.push(
    new Quiz({
      title: "Driftsstøtte",
      description: "Nettverk, skytjenester og sikkerhet",
      creator: admin._id,
      category: categories[2]._id,
      categoryLegacy: "driftsstøtte",
      questions: [
        {
          questionText: "Match protokoll med port:",
          questionType: "matching",
          options: [
            { optionText: "HTTP", matchTo: "80" },
            { optionText: "HTTPS", matchTo: "443" },
            { optionText: "SSH", matchTo: "22" },
          ],
        },
        {
          questionText:
            "Skytjenester er virtuelle ressurser levert over internett.",
          questionType: "true-false",
          options: [
            { optionText: "True", isCorrect: true },
            { optionText: "False", isCorrect: false },
          ],
        },
        {
          questionText:
            "Identifiser område i bildet der en serverrack plasseres.",
          questionType: "image-selection",
          imageCoordinates: [
            { x: 10, y: 20, width: 50, height: 100, label: "Serverrack" },
            { x: 200, y: 150, width: 30, height: 30, label: "Router" },
          ],
        },
        {
          questionText: "Hva gjør DHCP?",
          questionType: "short-answer",
          correctAnswer: "Tildeler IP-adresser automatisk",
        },
        {
          questionText: "Brannmur beskytter nettverk.",
          questionType: "true-false",
          options: [
            { optionText: "True", isCorrect: true },
            { optionText: "False", isCorrect: false },
          ],
        },
        {
          questionText: "Hvilket lag opererer Ethernet på?",
          questionType: "multiple-choice",
          options: [
            { optionText: "Datalink", isCorrect: true },
            { optionText: "Network", isCorrect: false },
            { optionText: "Transport", isCorrect: false },
            { optionText: "Physical", isCorrect: false },
          ],
        },
        {
          questionText: "Sorter nettverksmodeller:",
          questionType: "ordering",
          options: [
            { optionText: "Physical", orderPosition: 1 },
            { optionText: "Data Link", orderPosition: 2 },
            { optionText: "Network", orderPosition: 3 },
          ],
        },
        {
          questionText: "Ethernet bruker …",
          questionType: "fill-in-blanks",
          blankAnswers: ["CSMA/CD", "kobberkabler"],
        },
        {
          questionText: "Match port til protokoll:",
          questionType: "matching",
          options: [
            { optionText: "DNS", matchTo: "53" },
            { optionText: "FTP", matchTo: "21" },
            { optionText: "SMTP", matchTo: "25" },
          ],
        },
        {
          questionText: "Marker området for serverskap.",
          questionType: "image-selection",
          imageCoordinates: [
            { x: 15, y: 20, width: 80, height: 120, label: "Serverskap" },
          ],
        },
      ],
    })
  );

  // Save quizzes
  const saved = await Quiz.insertMany(quizzes);

  // Assign createdQuizzes to admin
  admin.createdQuizzes = saved.map((q) => q._id);
  await admin.save();

  console.log("Seed complete.");
  mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  mongoose.disconnect();
});
