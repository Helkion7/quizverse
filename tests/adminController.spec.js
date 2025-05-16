const adminController = require("../controllers/adminController");
const User = require("../models/User");

describe("adminController.deleteUser", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("rejects when an admin tries to delete themself", async () => {
    const req = { params: { id: "same" }, user: { id: "same" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await adminController.deleteUser(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "You cannot delete your own account",
    });
  });

  it("deletes another user successfully", async () => {
    const req = { params: { id: "other" }, user: { id: "admin" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    jest.spyOn(User, "findById").mockResolvedValue({ id: "other" });
    jest.spyOn(User, "findByIdAndDelete").mockResolvedValue();
    await adminController.deleteUser(req, res);
    expect(User.findById).toHaveBeenCalledWith("other");
    expect(User.findByIdAndDelete).toHaveBeenCalledWith("other");
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "User deleted successfully",
    });
  });

  it("returns 404 when user does not exist", async () => {
    const req = { params: { id: "nope" }, user: { id: "admin" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    jest.spyOn(User, "findById").mockResolvedValue(null);
    await adminController.deleteUser(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "User not found" });
  });
});
