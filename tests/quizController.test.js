const mongoose = require("mongoose");
const Quiz = require("../models/Quiz");
const quizController = require("../controllers/quizController");

jest.mock("../models/Quiz");

describe("quizController.getQuizzes", () => {
  beforeEach(() => {
    Quiz.find.mockClear();
  });

  test("returns public quizzes with no filters", async () => {
    const fakeQuizzes = [{ title: "A" }, { title: "B" }];
    const chain = {
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue(fakeQuizzes),
    };
    Quiz.find.mockReturnValue(chain);

    const result = await quizController.getQuizzes({}, 5);
    expect(Quiz.find).toHaveBeenCalledWith({ isPublic: true });
    expect(chain.limit).toHaveBeenCalledWith(5);
    expect(result).toBe(fakeQuizzes);
  });

  test("applies category and tag filters", async () => {
    const chain = {
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([]),
    };
    Quiz.find.mockReturnValue(chain);

    await quizController.getQuizzes(
      { category: "cat1", tag: "t1", search: "foo" },
      10
    );
    expect(Quiz.find).toHaveBeenCalledWith({
      isPublic: true,
      category: "cat1",
      tags: { $in: ["t1"] },
      $or: [
        { title: { $regex: "foo", $options: "i" } },
        { description: { $regex: "foo", $options: "i" } },
      ],
    });
  });
});

describe("quizController.getSuggestedTags", () => {
  beforeEach(() => {
    Quiz.aggregate.mockClear();
  });

  test("returns empty array if query too short", async () => {
    const req = { query: { q: "a" } };
    const json = jest.fn();
    await quizController.getSuggestedTags(req, { json });
    expect(json).toHaveBeenCalledWith([]);
  });

  test("aggregates tags and returns top matches", async () => {
    const tagsAgg = [{ _id: "x" }, { _id: "y" }];
    Quiz.aggregate.mockResolvedValue(tagsAgg);

    const req = { query: { q: "xy" } };
    const res = { json: jest.fn() };
    await quizController.getSuggestedTags(req, res);
    expect(Quiz.aggregate).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(["x", "y"]);
  });
});
