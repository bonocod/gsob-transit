const express = require('express');
const { validate, schemas } = require('../middleware/validate');
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/authController');

const router = express.Router();

// Rate limiter for login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15m
  max: 5,
  message: 'Too many login attempts — try again in 15 minutes.'
});

// Show registration form
router.get('/register', (req, res) => {
  res.render('register', {
    errorMessage: null
    // csrfToken is already in res.locals
  });
});

// Handle registration
router.post(
  '/register',
  validate(schemas.register),
  authController.register
);

// Show login form
router.get('/login', (req, res) => {
  res.render('login', {
    errorMessage: null
  });
});

// Handle login
router.post(
  '/login',
  loginLimiter,
  validate(schemas.login),
  authController.login
);

// Logout (GET or POST)
router.post('/logout', authController.logout);

module.exports = router;

