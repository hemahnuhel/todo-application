require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const flash = require('connect-flash');
const passport = require('./middleware/passport');
const bodyParser = require('body-parser');
const winston = require('winston');
const path = require('path');

// Logger setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => `${timestamp} [${level}]: ${message}`)
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/app.log' })
  ]
});

const app = express();

// DB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => logger.info('Connected to MongoDB'))
  .catch(err => logger.error('MongoDB connection error:', err));

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({ secret: process.env.SESSION_SECRET, resave: false, saveUninitialized: false }));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));


// Routes
app.use('/', require('./routes/auth'));
app.use('/tasks', require('./routes/tasks'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => logger.info(`Server running on port ${PORT}`));


// Global error handler – must be AFTER all routes
app.use((err, req, res, next) => {
  logger.error('Global error caught:', err.stack);  // always log full details

  // In development → show detailed error (helpful for debugging)
  // In production → hide stack trace from user
  const isDev = process.env.NODE_ENV !== 'production';

  // Set flash message so the form page can display it
  req.flash('error', isDev 
    ? `Server error: ${err.message}` 
    : 'Something went wrong. Please try again later.'
  );

  // Redirect back to where the user came from (or a safe default)
  // req.originalUrl is usually the page that caused the error
  const redirectTo = req.originalUrl || '/tasks';  // fallback to tasks if unknown

  // For auth pages, redirect to register/login instead
  if (req.originalUrl.includes('/register') || req.originalUrl.includes('/login')) {
    return res.redirect(req.originalUrl);  // stay on the same form page
  }

  // For most other cases (tasks, create, update), go back to tasks list
  res.redirect(redirectTo);
});