module.exports = (req, res, next) => {
  if (req.session.user && req.session.user.role === 'admin') {
    next();
  } else {
    res.status(403).render('error', { message: 'Access denied: Admins only' });
  }
};