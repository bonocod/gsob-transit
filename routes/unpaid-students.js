const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Booking = require('../models/Booking');
const logger = require('../config/logger');

router.get('/unpaid', async (req, res) => {
  try {
    const { promotion, className, combination } = req.query;
    const validPromotions = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6'];
    if (promotion && !validPromotions.includes(promotion)) {
      return res.status(400).render('error', { message: 'Invalid promotion' });
    }

    const paidUsers = await Booking.distinct('user', { status: 'paid' });
    let filter = { user: { $nin: paidUsers } };
    if (promotion) filter.promotion = promotion;
    if (className) filter.class = className;
    if (combination) filter.combination = combination;

    const unpaidStudents = await Student.find(filter);
    res.render('admin-unpaid', {
      unpaidStudents,
      filters: { promotion, className, combination },
      csrfToken: req.csrfToken()
    });
  } catch (err) {
    logger.error('Error fetching unpaid students', { error: err.message });
    res.status(500).render('error', { message: 'Server error' });
  }
});

module.exports = router;