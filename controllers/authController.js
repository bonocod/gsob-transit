const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Register Student
exports.register = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const existing = await User.findOne({ email });
    if (existing) return res.render('register', { error: 'User already exists' });

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
    res.redirect('/login'); // Trigger confetti
  } catch (err) {
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

    const token = jwt.sign(
      { id: user._id, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    res.cookie('token', token, { httpOnly: true });
    if (user.role === 'admin') {
      res.redirect('/admin/dashboard');
    } else {
      res.redirect('/booking');
    }
  } catch (err) {
    res.render('login', { error: 'Login failed' });
  }
};