const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Register Student
exports.register = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const existing = await User.findOne({ email });
    if (existing) {
      return res.render('register', { error: 'User already exists' });
    }

    if (!name || !email || !password) {
      return res.render('register', { error: 'All fields are required' });
    }

    const hash = await bcrypt.hash(password, 10);
    const user = new User({
      name,
      email,
      password: hash,
      role: 'student'
    });

    await user.save();
    // Optionally create a corresponding Student document here if desired
    res.redirect('/login'); // Trigger confetti
  } catch (err) {
    console.error('Registration failed:', err);
    res.render('register', { error: 'Registration failed' });
  }
};

// Login
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.render('login', { error: 'All fields are required' });
    }

    const user = await User.findOne({ email });
    if (!user) return res.render('login', { error: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.render('login', { error: 'Invalid credentials' });

    // Set session user data instead of JWT
    req.session.user = {
      id: user._id,
      role: user.role,
      name: user.name,
      email: user.email
    };

    if (user.role === 'admin') {
      res.redirect('/admin/dashboard');
    } else {
      res.redirect('/booking');
    }
  } catch (err) {
    console.error('Login failed:', err);
    res.render('login', { error: 'Login failed' });
  }
};

exports.logout = (req, res, next) => {
  req.session.destroy(err => {
    if (err) return next(err);
    res.clearCookie('connect.sid');
    res.redirect('/auth/login');
  });
};
