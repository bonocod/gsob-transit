// BACKEND ROUTE TO FILTER UNPAID STUDENTS

const express = require('express');
const router = express.Router();

const Student = require('../models/Student');
const Booking = require('../models/Booking');

router.get('/unpaid', async (req, res) => {
  try {
    const { promotion, className, combination } = req.query;

    // Get all student IDs who have paid
    const paidUsers = await Booking.distinct('user', { status: 'paid' });

    // Build filter object
    let filter = { _id: { $nin: paidUsers } };

    if (promotion) filter.promotion = promotion;
    if (className) filter.class = className;
    if (combination) filter.combination = combination;

    const unpaidStudents = await Student.find(filter);

    res.render('admin-unpaid', {
      unpaidStudents,
      filters: { promotion, className, combination }
    });
  } catch (err) {
    console.error('Error fetching unpaid students:', err);
    res.status(500).send('Server error');
  }
});

module.exports = router;
