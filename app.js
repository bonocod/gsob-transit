const express = require('express');
require('dotenv').config();
const path = require('path');
const mongoose = require('mongoose');
const session = require('express-session');
const csrf = require('csurf');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const isAdmin = require('./middleware/isAdmin');
const isStudent = require('./middleware/isStudent');
const adminRoutes = require('./routes/admin');
const logger = require('./config/logger');
const connectDB = require('./config/db');
const Student = require('./models/Student');

const app = express();

// Database connection
connectDB();

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('trust proxy', 1);

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Session configuration
if (!process.env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET must be defined in .env');
}

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  }
}));

// CSRF protection
app.use(csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax'
  }
}));

// Expose CSRF token, admin, and student to views
app.use(async (req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  res.locals.currentAdmin = req.session.admin || null;
  res.locals.currentStudent = null;
  if (req.session.studentId) {
    try {
      res.locals.currentStudent = await Student.findById(req.session.studentId);
    } catch (err) {
      logger.error('Failed to load student from session', { error: err.message });
    }
  }
  next();
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});

// Routes
const authRoutes = require('./routes/auth');
const bookingRoutes = require('./routes/booking');
const studentRoutes = require('./routes/student');
app.use('/auth', limiter, authRoutes);
app.use('/student', limiter, studentRoutes);
app.use('/booking', limiter, isStudent, bookingRoutes);
app.use('/admin', isAdmin, adminRoutes);

app.get('/ticket-success', (req, res) => res.render('ticket-success'));
app.get('/ticket-failure', (req, res) => res.render('ticket-failure', { message: req.query.message }));

// Root route
app.get('/', (req, res) => {
  if (req.session.admin) {
    return res.render('admin', { currentAdmin: req.session.admin });
  }
  res.render('index', { errorMessage: null });
});

// 404 Error
app.use((req, res, next) => {
  res.status(404).render('404', { message: 'Page Not Found' });
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error('Server error', { error: err.message, stack: err.stack });

  if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).render('error', {
      error: err,
      message: 'Form tampered with or session expired.',
      csrfToken: req.csrfToken()
    });
  }

  res.status(err.status || 500).render('error', {
    error: err,
    message: err.message || 'Internal Server Error',
    csrfToken: req.csrfToken()
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

module.exports = app;