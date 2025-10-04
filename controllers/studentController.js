const Student = require('../models/Student');
const logger = require('../config/logger');

exports.verifyCode = async (req, res) => {
  const { code } = req.body;

  try {
    // Check if code is an admin code
    if (process.env.ADMIN_CODE && process.env.ADMIN_CODE.split(',').includes(code)) {
      req.session.admin = { role: 'admin', name: 'Admin' };
      logger.info('Admin accessed via code', { code });
      return res.redirect('/admin/dashboard');
    }

    // Check if code is a student code
    if (code.length !== 4 || !/^\d{4}$/.test(code)) {
      return res.render('index', {
        errorMessage: 'Invalid code. Please enter a 4-digit student code.',
        csrfToken: req.csrfToken()
      });
    }

    const student = await Student.findOne({ studentCode: code });
    if (!student) {
      return res.render('index', {
        errorMessage: 'Student code not found.',
        csrfToken: req.csrfToken()
      });
    }

    res.render('confirmation', { student, csrfToken: req.csrfToken() });
  } catch (err) {
    logger.error('Code verification failed', { error: err.message });
    res.render('index', {
      errorMessage: 'Verification failed. Please try again.',
      csrfToken: req.csrfToken()
    });
  }
};

exports.confirmStudent = async (req, res) => {
  const { confirm, studentId } = req.body;

  try {
    if (confirm === 'yes') {
      const student = await Student.findById(studentId);
      if (!student) {
        return res.render('index', {
          errorMessage: 'Student not found.',
          csrfToken: req.csrfToken()
        });
      }
      req.session.studentId = studentId;
      logger.info('Student confirmed', { studentId });
      res.redirect('/booking');
    } else {
      res.redirect('/');
    }
  } catch (err) {
    logger.error('Student confirmation failed', { error: err.message });
    res.render('index', {
      errorMessage: 'Confirmation failed. Please try again.',
      csrfToken: req.csrfToken()
    });
  }
};