const request = require("supertest");
const app = require("../server");
const mongoose = require("mongoose");
const User = require("../models/User");
const Task = require("../models/Task");

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI);
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe("Task Routes", () => {
  let user;
  let agent;

  beforeEach(async () => {
    user = new User({ username: "testuser", password: "testpass" });
    await user.save();
    agent = request.agent(app);
    await agent
      .post("/login")
      .send({ username: "testuser", password: "testpass" });
  });

  afterEach(async () => {
    await User.deleteMany({});
    await Task.deleteMany({});
  });

  test("Create task", async () => {
    const res = await agent.post("/tasks/create").send({ title: "Test Task" });
    expect(res.status).toBe(302); // Redirect
    const task = await Task.findOne({ title: "Test Task" });
    expect(task).not.toBeNull();
    expect(task.user.toString()).toBe(user._id.toString());
  });

  test("Update task status", async () => {
    const task = new Task({ title: "Update Me", user: user._id });
    await task.save();
    const res = await agent
      .post(`/tasks/${task._id}/update`)
      .send({ status: "completed" });
    expect(res.status).toBe(302);
    const updatedTask = await Task.findById(task._id);
    expect(updatedTask.status).toBe("completed");
  });
});
