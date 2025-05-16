const authController = require("../controllers/authController");

describe("authController.getLogin", () => {
  it("redirects to dashboard if already logged in", () => {
    const req = { user: { id: "u1" } };
    const res = { redirect: jest.fn(), render: jest.fn() };
    authController.getLogin(req, res);
    expect(res.redirect).toHaveBeenCalledWith("/user/dashboard");
    expect(res.render).not.toHaveBeenCalled();
  });

  it("renders login view if not logged in", () => {
    const req = {};
    const res = { redirect: jest.fn(), render: jest.fn() };
    authController.getLogin(req, res);
    expect(res.render).toHaveBeenCalledWith("auth/login", {
      title: "Login",
      error: null,
    });
    expect(res.redirect).not.toHaveBeenCalled();
  });
});
