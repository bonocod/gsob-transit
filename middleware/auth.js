const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const token = req.cookies.token || req.header('Authorization')?.split(' ')[1];

  if (!token) {
    return res.redirect('/login');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // contains { id, role }
    next();
  } catch (err) {
    res.redirect('/login');
  }
};

