const express = require('express');
require('dotenv').config();
const path = require('path');
const mongoose = require('mongoose');
const session = require('express-session');
const csurf = require('csurf');
const rateLimit = require('express-rate-limit');
const authMiddleware = require('./middleware/auth');
const isAdmin = require('./middleware/isAdmin');
const adminRoutes = require('./routes/admin');
const logger = require('./config/logger');
const connectDB = require('./config/db');

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
const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  }
});

app.use(csrfProtection);


// Rate limiting for sensitive routes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});

// CSRF token middleware
app.use((req, res, next) => {
  if (['/auth/login', '/auth/register', '/booking', '/confirm-booking', '/admin/bookings', '/unpaid-students'].some(path => req.path.startsWith(path))) {
    res.locals.csrfToken = req.csrfToken();
  }
  res.locals.currentUser = req.session.user;
  next();
});

// Routes
const authRoutes = require('./routes/auth');
const bookingRoutes = require('./routes/booking');
app.use('/auth',limiter, authRoutes);
app.use('/booking',limiter,authMiddleware, bookingRoutes);
app.use('/admin', authMiddleware, isAdmin, adminRoutes);


app.get('/ticket-success', (req, res) => res.render('ticket-success'));
app.get('/ticket-failure', (req, res) => res.render('ticket-failure', { message: req.query.message }));

// Root route
app.get('/', (req, res) => {
  res.render('index');
});

// Error handling
app.use((req, res, next) => {
  res.status(404).render('404', { message: 'Page Not Found' });
});

app.use((err, req, res, next) => {
  logger.error('Server error', { error: err.message, stack: err.stack });
  if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).render('error', { 
      error: err,
      message: 'Form tampered with.',
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

