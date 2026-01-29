const express = require("express");
const passport = require("passport");
const User = require("../models/User");
const router = express.Router();

router.get("/register", (req, res) => {
  res.render("register", {
    messages: req.flash(),
  });
});

router.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      req.flash("error", "Username and password are required");
      return res.redirect("/register");
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      req.flash("error", "Username already taken");
      return res.redirect("/register");
    }

    const user = new User({ username, password });
    await user.save();

    req.flash("success", "Registered successfully! Please log in.");
    res.redirect("/login");
  } catch (err) {
    console.error("Registration error:", err); // log for debugging
    req.flash("error", "Something went wrong during registration");
    res.redirect("/register");
  }
});

router.get("/login", (req, res) => {
  res.render("login", {
    messages: req.flash(),
  });
});
router.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/tasks",
    failureRedirect: "/login",
    failureFlash: true,
  }),
);

router.get("/logout", (req, res) => {
  req.logout(() => res.redirect("/login"));
});

module.exports = router;
