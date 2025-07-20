const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Booking = require('../models/Booking');
const { Parser } = require('json2csv');
const logger = require('../config/logger');

router.get('/dashboard', (req, res) => {
  res.render('admin', { user: req.session.user });
});

router.get('/summary', async (req, res) => {
  try {
    const summary = await Student.aggregate([
      {
        $lookup: {
          from: 'bookings',
          localField: 'user',
          foreignField: 'user',
          as: 'bookings'
        }
      },
      { $unwind: { path: '$bookings', preserveNullAndEmptyArrays: true } },
      { $match: { 'bookings.status': 'paid' } },
      {
        $group: {
          _id: {
            promotion: '$promotion',
            destination: '$bookings.destination'
          },
          studentsSet: { $addToSet: '$user' },
          totalPaid: { $sum: { $ifNull: ['$bookings.price', 0] } }
        }
      },
      {
        $project: {
          promotion: '$_id.promotion',
          destination: '$_id.destination',
          numberOfStudents: { $size: '$studentsSet' },
          totalPaid: 1,
          _id: 0
        }
      },
      { $sort: { promotion: 1, destination: 1 } }
    ]);

    const overallPerDestination = await Student.aggregate([
      {
        $lookup: {
          from: 'bookings',
          localField: 'user',
          foreignField: 'user',
          as: 'bookings'
        }
      },
      { $unwind: { path: '$bookings', preserveNullAndEmptyArrays: true } },
      { $match: { 'bookings.status': 'paid' } },
      {
        $group: {
          _id: '$bookings.destination',
          studentsSet: { $addToSet: '$user' },
          totalPaid: { $sum: { $ifNull: ['$bookings.price', 0] } }
        }
      },
      {
        $project: {
          promotion: 'All',
          destination: '$_id',
          numberOfStudents: { $size: '$studentsSet' },
          totalPaid: 1,
          _id: 0
        }
      },
      { $sort: { destination: 1 } }
    ]);

    const paidStudents = await Booking.aggregate([
      { $match: { status: 'paid' } },
      {
        $lookup: {
          from: 'students',
          localField: 'user',
          foreignField: 'user',
          as: 'student'
        }
      },
      { $unwind: '$student' },
      {
        $project: {
          fullName: '$student.name',
          promotion: '$student.promotion',
          class: '$student.class',
          destination: '$destination',
          phone: '$phone',
          amountPaid: '$price',
          bookedAt: '$bookedAt'
        }
      },
      { $sort: { bookedAt: -1 } }
    ]);

    const destinationSummary = [...summary, ...overallPerDestination];

    res.render('admin-summary', {
      destinationSummary,
      paidStudents
    });
  } catch (error) {
    logger.error('Aggregation error', { error: error.message });
    res.status(500).render('error', { message: 'Server error' });
  }
});

router.get('/manage/:promotion', async (req, res) => {
  try {
    const promotion = req.params.promotion.toUpperCase();
    if (!['S1', 'S2', 'S3', 'S4', 'S5', 'S6'].includes(promotion)) {
      return res.status(400).render('error', { message: 'Invalid promotion' });
    }
    const isOLevel = ['S1', 'S2', 'S3'].includes(promotion);
    const field = isOLevel ? 'class' : 'combination';
    const items = await Student.distinct(field, { promotion });
    res.render('manage-classes', { promotion, items });
  } catch (err) {
    logger.error('Error fetching classes', { error: err.message });
    res.status(500).render('error', { message: 'Server error' });
  }
});

router.get('/manage/:promotion/:item', async (req, res) => {
  try {
    const promotion = req.params.promotion.toUpperCase();
    const item = req.params.item;
    if (!['S1', 'S2', 'S3', 'S4', 'S5', 'S6'].includes(promotion)) {
      return res.status(400).render('error', { message: 'Invalid promotion' });
    }
    const students = await Student.aggregate([
      {
        $match: {
          promotion,
          $or: [
            { class: item },
            { combination: item }
          ]
        }
      },
      {
        $lookup: {
          from: 'bookings',
          localField: 'user',
          foreignField: 'user',
          as: 'bookings'
        }
      },
      {
        $addFields: {
          paid: { $gt: [{ $size: '$bookings' }, 0] },
          destination: { $arrayElemAt: ['$bookings.destination', 0] },
          bookedAt: { $arrayElemAt: ['$bookings.bookedAt', 0] }
        }
      },
      {
        $project: {
          name: 1,
          paid: 1,
          destination: 1,
          bookedAt: 1
        }
      }
    ]);

    const total = students.length;
    const paidCount = students.filter(s => s.paid).length;
    const unpaidCount = total - paidCount;

    res.render('class-student-list', {
      promotion,
      className: item,
      students,
      total,
      paidCount,
      unpaidCount
    });
  } catch (err) {
    logger.error('Error fetching students', { error: err.message });
    res.status(500).render('error', { message: 'Server error' });
  }
});

router.get('/export/summary', async (req, res) => {
  try {
    const summary = await Student.aggregate([
      {
        $lookup: {
          from: 'bookings',
          localField: 'user',
          foreignField: 'user',
          as: 'booking'
        }
      },
      { $unwind: { path: '$booking', preserveNullAndEmptyArrays: true } },
      { $match: { 'booking.status': 'paid' } },
      {
        $group: {
          _id: {
            promotion: '$promotion',
            destination: '$booking.destination'
          },
          studentsSet: { $addToSet: '$user' },
          totalPaid: { $sum: '$booking.price' }
        }
      },
      {
        $project: {
          promotion: '$_id.promotion',
          destination: '$_id.destination',
          numberOfStudents: { $size: '$studentsSet' },
          totalPaid: 1,
          _id: 0
        }
      },
      { $sort: { promotion: 1, destination: 1 } }
    ]);

    const parser = new Parser();
    const csv = parser.parse(summary);

    res.header('Content-Type', 'text/csv');
    res.attachment('summary.csv');
    return res.send(csv);
  } catch (error) {
    logger.error('Error exporting summary', { error: error.message });
    res.status(500).render('error', { message: 'Error exporting summary' });
  }
});

router.get('/bookings', async (req, res) => {
  try {
    const bookings = await Booking.find({}).populate('user', 'name email');
    res.render('admin-bookings', { bookings, csrfToken: req.csrfToken() });
  } catch (error) {
    logger.error('Error fetching bookings', { error: error.message });
    res.status(500).render('error', { message: 'Server error' });
  }
});

router.post('/bookings/:id/paid', async (req, res) => {
  try {
    await Booking.findByIdAndUpdate(req.params.id, { status: 'paid' });
    res.redirect('/admin/bookings');
  } catch (error) {
    logger.error('Error updating booking', { error: error.message });
    res.status(500).render('error', { message: 'Error updating booking' });
  }
});

module.exports = router;