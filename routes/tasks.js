const express = require("express");
const Task = require("../models/Task");
const router = express.Router();

// Middleware: Ensure authenticated
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  res.redirect("/login");
};

router.use(isAuthenticated);

router.get("/", async (req, res) => {
  try {
    const sort = req.query.sort || "pending";
    let tasks = await Task.find({
      user: req.user._id,
      status: { $ne: "deleted" },
    }).sort({ createdAt: -1 });

    if (sort !== "all") {
      tasks = tasks.filter((t) => t.status === sort);
    }

    res.render("tasks", {
      tasks,
      user: req.user,
      messages: req.flash(),
      sort,
    });
  } catch (err) {
    req.flash("error", "Failed to load tasks");
    res.redirect("/tasks");
  }
});

router.post("/create", async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title) throw new Error("Title required");
    const task = new Task({ title, description, user: req.user._id });
    await task.save();
    req.flash("success", "Task created!");
    res.redirect("/tasks");
  } catch (err) {
    req.flash("error", err.message);
    res.redirect("/tasks");
  }
});

router.post("/:id/:action", async (req, res) => {
  try {
    const { action } = req.params;
    const validActions = ["complete", "delete"];

    if (!validActions.includes(action)) {
      req.flash("error", "Invalid action");
      return res.redirect("/tasks");
    }

    const task = await Task.findOne({ _id: req.params.id, user: req.user._id });
    if (!task) {
      req.flash("error", "Task not found");
      return res.redirect("/tasks");
    }

    if (action === "complete") {
      task.status = "completed";
    } else if (action === "delete") {
      task.status = "deleted";
    }

    await task.save();
    req.flash("success", `Task ${action}d!`);
    res.redirect("/tasks");
  } catch (err) {
    req.flash("error", "Failed to update task");
    res.redirect("/tasks");
  }
});

module.exports = router;
