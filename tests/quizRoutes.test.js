const request = require("supertest");
const express = require("express");

// Mock authMiddleware to control req.user
jest.mock("../middleware/authMiddleware", () => ({
  isAuthenticated: (req, res, next) => {
    if (req.headers["authorization"] === "Bearer valid-token") {
      req.user = { _id: "user1", username: "tester" };
      return next();
    }
    return res.status(401).send("Unauthorized");
  },
}));

// Mock quizController methods
const quizController = require("../controllers/quizController");
quizController.getBrowse = jest.fn((req, res) =>
  res.status(200).send("browse-ok")
);
quizController.getCreate = jest.fn((req, res) =>
  res.status(200).send("create-form")
);
quizController.postCreate = jest.fn((req, res) =>
  res.status(302).redirect("/quiz/123")
);
quizController.getQuizDetails = jest.fn((req, res) =>
  res.status(200).send("details")
);
quizController.getTake = jest.fn((req, res) =>
  res.status(200).send("take-form")
);
quizController.postSubmit = jest.fn((req, res) =>
  res.status(200).send("results")
);
quizController.getSuggestedTags = jest.fn((req, res) =>
  res.json(["tag1", "tag2"])
);
quizController.authRequiredForQuiz = jest.fn((req, res) =>
  res.redirect("/auth/login?returnTo=/quiz/999")
);

const router = require("../routes/quizRoutes");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use("/quiz", router);

describe("Quiz Routes", () => {
  test("GET /quiz/browse → 200", async () => {
    const res = await request(app).get("/quiz/browse");
    expect(res.status).toBe(200);
    expect(res.text).toBe("browse-ok");
  });

  test("GET /quiz/create without auth → 401", async () => {
    const res = await request(app).get("/quiz/create");
    expect(res.status).toBe(401);
  });

  test("GET /quiz/create with auth → 200", async () => {
    const res = await request(app)
      .get("/quiz/create")
      .set("Authorization", "Bearer valid-token");
    expect(res.status).toBe(200);
    expect(res.text).toBe("create-form");
  });

  test("POST /quiz/create with auth → redirect", async () => {
    const res = await request(app)
      .post("/quiz/create")
      .set("Authorization", "Bearer valid-token")
      .send({ title: "T", category: "c", questions: "[]" });
    expect(res.status).toBe(302);
    expect(res.headers.location).toMatch(/\/quiz\/123/);
  });

  test("GET /quiz/auth-required/:id → redirect to login", async () => {
    const res = await request(app).get("/quiz/auth-required/999");
    expect(res.status).toBe(302);
    expect(res.headers.location).toContain("returnTo=/quiz/999");
  });

  test("GET /quiz/api/tags/suggest?q=ta → json array", async () => {
    const res = await request(app).get("/quiz/api/tags/suggest?q=ta");
    expect(res.status).toBe(200);
    expect(res.body).toEqual(["tag1", "tag2"]);
  });

  test("GET /quiz/:id → details", async () => {
    const res = await request(app).get("/quiz/555");
    expect(res.status).toBe(200);
    expect(res.text).toBe("details");
  });

  test("GET /quiz/:id/take → take form", async () => {
    const res = await request(app).get("/quiz/321/take");
    expect(res.status).toBe(200);
    expect(res.text).toBe("take-form");
  });

  test("POST /quiz/:id/submit → results", async () => {
    const res = await request(app)
      .post("/quiz/321/submit")
      .send({ answers: {} });
    expect(res.status).toBe(200);
    expect(res.text).toBe("results");
  });
});
