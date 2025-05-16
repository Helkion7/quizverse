const {
  getDateForTimePeriod,
} = require("../controllers/leaderboardController");

describe("getDateForTimePeriod", () => {
  it("returns ~7 days ago for 'weekly'", () => {
    const now = Date.now();
    const then = getDateForTimePeriod("weekly").getTime();
    const delta = now - then;
    expect(delta).toBeGreaterThanOrEqual(7 * 24 * 60 * 60 * 1000);
    expect(delta).toBeLessThan((7 * 24 + 1) * 60 * 60 * 1000);
  });

  it("returns ~1 month ago for 'monthly'", () => {
    const now = new Date();
    const then = getDateForTimePeriod("monthly");
    expect(then.getMonth()).toBe(
      now.getMonth() - 1 >= 0 ? now.getMonth() - 1 : then.getMonth()
    );
  });

  it("returns epoch for unknown period", () => {
    const then = getDateForTimePeriod("nonsense").getTime();
    expect(then).toBe(0);
  });

  it("returns epoch for 'all-time'", () => {
    const then = getDateForTimePeriod("all-time").getTime();
    expect(then).toBe(0);
  });

  it("returns a Date instance", () => {
    const date = getDateForTimePeriod("weekly");
    expect(date).toBeInstanceOf(Date);
  });

  it("returns ~30 days ago for 'monthly' using time diff", () => {
    const now = Date.now();
    const then = getDateForTimePeriod("monthly").getTime();
    const delta = now - then;
    const msInDay = 24 * 60 * 60 * 1000;
    expect(delta).toBeGreaterThanOrEqual(28 * msInDay);
    expect(delta).toBeLessThan(32 * msInDay);
  });
});
