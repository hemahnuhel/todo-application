require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("./middleware/passport");
const bodyParser = require("body-parser");
const winston = require("winston");
const path = require("path");

// Logger setup
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(
      ({ timestamp, level, message }) => `${timestamp} [${level}]: ${message}`,
    ),
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "logs/app.log" }),
  ],
});

const app = express(); // ← MUST be defined BEFORE any app.use() or app.get()

// DB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => logger.info("Connected to MongoDB"))
  .catch((err) => logger.error("MongoDB connection error:", err));

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  }),
);
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Redirect root to login (or tasks if already logged in)
app.get("/", (req, res) => {
  if (req.isAuthenticated()) {
    res.redirect("/tasks");
  } else {
    res.redirect("/login");
  }
});

// Routes
app.use("/", require("./routes/auth"));
app.use("/tasks", require("./routes/tasks"));

// Global error handler
app.use((err, req, res, next) => {
  logger.error("Global error caught:", err.stack);

  const isDev = process.env.NODE_ENV !== "production";

  req.flash(
    "error",
    isDev
      ? `Server error: ${err.message}`
      : "Something went wrong. Please try again later.",
  );

  const redirectTo = req.originalUrl || "/tasks";

  if (
    req.originalUrl.includes("/register") ||
    req.originalUrl.includes("/login")
  ) {
    return res.redirect(req.originalUrl);
  }

  res.redirect(redirectTo);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => logger.info(`Server running on port ${PORT}`));
