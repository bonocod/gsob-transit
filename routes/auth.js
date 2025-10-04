const express = require('express');
const logger = require('../config/logger');

const router = express.Router();

router.get('/admin-code', (req, res) => {
  res.render('admin-code', { errorMessage: null, csrfToken: req.csrfToken() });
});

router.post('/admin-code', async (req, res, next) => {
  const { adminCode } = req.body;
  const validCodes = process.env.ADMIN_CODE ? process.env.ADMIN_CODE.split(',') : [];

  try {
    if (!validCodes.includes(adminCode)) {
      return res.render('admin-code', {
        errorMessage: 'Invalid admin code',
        csrfToken: req.csrfToken()
      });
    }

    req.session.admin = { name: 'Admin', code: adminCode };
    await new Promise((resolve, reject) => {
      req.session.save((err) => {
        if (err) return reject(err);
        resolve();
      });
    });

    logger.info('Admin logged in', { adminCode });
    res.redirect('/admin/dashboard');
  } catch (err) {
    logger.error('Error in admin login', { error: err.message });
    next(err); // Pass to global error handler
  }
});

router.get('/logout', (req, res, next) => {
  req.session.destroy((err) => {
    if (err) {
      logger.error('Error during logout', { error: err.message });
      return next(err);
    }
    res.redirect('/');
  });
});

module.exports = router;