const User = require('../models/User');
const Student = require('../models/Student');
const logger = require('../config/logger');

exports.register = async (req, res) => {
  const { name, email, password, urubutoCode } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.render('register', { errorMessage: 'User already exists', csrfToken: req.csrfToken() });
    }

    if (!name || !email || !password || !urubutoCode) {
      return res.render('register', { errorMessage: 'Name, email, password, and Urubuto code are required', csrfToken: req.csrfToken() });
    }

    const student = await Student.findOne({ urubutoCode });
    if (!student) {
      return res.render('register', { errorMessage: 'Urubuto code not found', csrfToken: req.csrfToken() });
    }
    if (student.user) {
      return res.render('register', { errorMessage: 'This Urubuto code is already linked to a user', csrfToken: req.csrfToken() });
    }

    const user = new User({
      name,
      email,
      password,
      role: 'student'
    });
    await user.save();

    await Student.findByIdAndUpdate(student._id, { user: user._id });

    logger.info('User registered and linked to student', { email, urubutoCode });
    res.redirect('/auth/login');
  } catch (err) {
    logger.error('Registration failed', { error: err.message, email });
    res.render('register', { errorMessage: 'Registration failed', csrfToken: req.csrfToken() });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.render('login', { errorMessage: 'All fields are required', csrfToken: req.csrfToken() });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.render('login', { errorMessage: 'invalid email address', csrfToken: req.csrfToken() });
    }

    const match = await user.comparePassword(password);
    if (!match) {
      return res.render('login', { errorMessage: 'incorrect password', csrfToken: req.csrfToken() });
    }

    const student = await Student.findOne({ user: user._id });
    req.session.user = {
      id: user._id,
      role: user.role,
      name: user.name,
      email: user.email
    };

    logger.info('User logged in', { email, role: user.role });
    switch (user.role) {
      case 'admin':
        res.redirect('/');
        break;
      case 'student':
        if (!student) {
          return res.render('login', { errorMessage: 'Your account is not linked to a student record. Contact an admin.', csrfToken: req.csrfToken() });
        }
        res.redirect('/');
        break;
      default:
        logger.warn('Unknown role detected', { email, role: user.role });
        return res.render('login', { errorMessage: 'Unknown user role. Contact an admin.', csrfToken: req.csrfToken() });
    }
  } catch (err) {
    logger.error('Login failed', { error: err.message, email });
    res.render('login', { errorMessage: 'Login failed', csrfToken: req.csrfToken() });
  }
};

exports.logout = (req, res, next) => {
  req.session.destroy(err => {
    if (err) {
      logger.error('Logout failed', { error: err.message });
      return next(err);
    }
    res.clearCookie('connect.sid');
    logger.info('User logged out');
    res.redirect('/');
  });
};