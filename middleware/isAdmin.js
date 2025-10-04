const logger = require('../config/logger');

module.exports = (req, res, next) => {
  if (!req.session.admin) {
    logger.warn('Unauthorized access to admin route', { path: req.originalUrl });
    const error = new Error('Access denied: Admin code required');
    error.status = 403;
    return next(error); // Pass to global error handler instead of redirect
  }
  next();
};