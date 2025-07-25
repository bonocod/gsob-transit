const express = require('express');
const { validate, schemas } = require('../middleware/validate');
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/authController');

const router = express.Router();

// Rate limiter for login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1, // 15 minutes
  max: 5,
  message: 'Too many login attempts — try again in 15 minutes.'
});

// Show registration form
router.get('/register', (req, res) => {
  res.render('register', {
    errorMessage: null,
    csrfToken: req.csrfToken()
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
    errorMessage: null,
    csrfToken: req.csrfToken()
  });
});

// Handle login
router.post(
  '/login',
  loginLimiter,
  validate(schemas.login),
  authController.login
);

// Logout
router.get('/logout', authController.logout);

module.exports = router;