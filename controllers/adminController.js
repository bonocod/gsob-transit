// controllers/adminController.js
const Booking = require('../models/Booking');
const Student = require('../models/Student');
const logger = require('../config/logger');
const { Parser } = require('json2csv');

exports.dashboard = (req, res) => {
  res.render('admin', { user: req.session.user });
};

exports.summary = async (req, res) => {
  try {
    const bookingsByPromoDest = await Booking.aggregate([
      { $match: { status: 'paid' } },
      {
        $lookup: {
          from: 'students',
          localField: 'user',
          foreignField: 'user',
          as: 'studentData'
        }
      },
      { $unwind: '$studentData' },
      {
        $group: {
          _id: {
            promotion: '$studentData.promotion',
            destination: '$destination'
          },
          numberOfStudents: { $sum: 1 },
          totalPaid: { $sum: '$price' }
        }
      },
      { $sort: { '_id.promotion': 1, '_id.destination': 1 } }
    ]);

    const grouped = {};
    bookingsByPromoDest.forEach(item => {
      const { promotion, destination } = item._id;
      if (!grouped[destination]) grouped[destination] = { numberOfStudents: 0, totalPaid: 0 };
      grouped[destination].numberOfStudents += item.numberOfStudents;
      grouped[destination].totalPaid += item.totalPaid;
    });

    const destinationSummary = bookingsByPromoDest.map(item => ({
      promotion: item._id.promotion,
      destination: item._id.destination,
      numberOfStudents: item.numberOfStudents,
      totalPaid: item.totalPaid
    }));

    Object.entries(grouped).forEach(([destination, data]) => {
      destinationSummary.push({
        promotion: 'All',
        destination,
        numberOfStudents: data.numberOfStudents,
        totalPaid: data.totalPaid
      });
    });

    res.render('admin-summary', {
      user: req.session.user,
      destinationSummary
    });
  } catch (err) {
    logger.error('Failed to generate summary', { error: err.message });
    res.status(500).render('error', { error: err, message: 'Failed to load summary' });
  }
};

exports.bookings = async (req, res) => {
  try {
    const bookings = await Booking.find().populate('user');
    res.render('admin-bookings', { user: req.session.user, bookings });
  } catch (err) {
    logger.error('Failed to load bookings', { error: err.message });
    res.status(500).render('error', { error: err, message: 'Failed to load bookings' });
  }
};

exports.markPaid = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).render('error', { message: 'Booking not found' });
    }
    booking.status = 'paid';
    await booking.save();
    logger.info('Booking marked as paid', { bookingId });
    res.redirect('/admin/bookings');
  } catch (err) {
    logger.error('Failed to mark booking as paid', { error: err.message });
    res.status(500).render('error', { error: err, message: 'Failed to mark booking as paid' });
  }
};

exports.manageClasses = (req, res) => {
  const promotion = req.params.promotion;
  let items;
  if (['S1', 'S2', 'S3'].includes(promotion)) {
    items = ['A', 'B', 'C', 'D'];
  } else if (['S4', 'S5', 'S6'].includes(promotion)) {
    items = ['MPC', 'MCB', 'ANP', 'PCBa', 'PCBb', 'PCM'];
  } else {
    return res.status(400).render('error', { message: 'Invalid promotion' });
  }
  res.render('manage-classes', { promotion, items });
};

exports.classStudents = async (req, res) => {
  try {
    const promotion = req.params.promotion;
    const group = req.params.group;
    let query = { promotion: promotion };

    if (['S1', 'S2', 'S3'].includes(promotion)) {
      query.class = group;
    } else {
      query.combination = group;
    }

    const students = await Student.find(query).populate('user');
    const userIds = students.map(s => s.user?._id).filter(Boolean);
    const bookings = await Booking.find({ user: { $in: userIds } });

    const bookingMap = {};
    bookings.forEach(b => {
      bookingMap[b.user.toString()] = b;
    });

    const studentData = students.map(s => {
      const booking = bookingMap[s.user?._id?.toString() || ''];
      return {
        name: s.name,
        urubutoCode: s.urubutoCode,
        destination: booking?.destination || null,
        hasBooking: !!booking,
        bookedAt: booking?.bookedAt || null,
        paid: booking?.status === 'paid'
      };
    });

    const total = studentData.length;
    const paidCount = studentData.filter(s => s.paid).length;
    const unpaidCount = total - paidCount;

    res.render('class-student-list', {
      user: req.session.user,
      promotion,
      className: group,
      students: studentData,
      total,
      paidCount,
      unpaidCount
    });
  } catch (err) {
    logger.error('Failed to load class student list', { error: err.message });
    res.status(500).render('error', { error: err, message: 'Failed to load students for class' });
  }
};

exports.exportSummary = async (req, res) => {
  try {
    const bookingsByPromoDest = await Booking.aggregate([
      { $match: { status: 'paid' } },
      {
        $lookup: {
          from: 'students',
          localField: 'user',
          foreignField: 'user',
          as: 'studentData'
        }
      },
      { $unwind: '$studentData' },
      {
        $group: {
          _id: {
            promotion: '$studentData.promotion',
            destination: '$destination'
          },
          numberOfStudents: { $sum: 1 },
          totalPaid: { $sum: '$price' }
        }
      },
      { $sort: { '_id.promotion': 1, '_id.destination': 1 } }
    ]);

    const grouped = {};
    bookingsByPromoDest.forEach(item => {
      const { promotion, destination } = item._id;
      if (!grouped[destination]) grouped[destination] = { numberOfStudents: 0, totalPaid: 0 };
      grouped[destination].numberOfStudents += item.numberOfStudents;
      grouped[destination].totalPaid += item.totalPaid;
    });

    const destinationSummary = bookingsByPromoDest.map(item => ({
      promotion: item._id.promotion,
      destination: item._id.destination,
      Students: item.numberOfStudents,
      TotalPaid: item.totalPaid
    }));

    Object.entries(grouped).forEach(([destination, data]) => {
      destinationSummary.push({
        promotion: 'All',
        destination,
        Students: data.numberOfStudents,
        TotalPaid: data.totalPaid
      });
    });

    const fields = [
      { label: 'Promotion', value: 'promotion' },
      { label: 'Destination', value: 'destination' },
      { label: 'Number of Students', value: 'Students' },
      { label: 'Total Paid (RWF)', value: 'TotalPaid' }
    ];
    const parser = new Parser({ fields });
    const csv = parser.parse(destinationSummary);

    res.header('Content-Type', 'text/csv');
    res.attachment('summary.csv');
    res.send(csv);
  } catch (err) {
    logger.error('Failed to export summary CSV', { error: err.message });
    res.status(500).render('error', { error: err, message: 'Failed to export summary' });
  }
};

exports.exportClassList = async (req, res) => {
  try {
    const promotion = req.params.promotion;
    const group = req.params.group;
    let query = { promotion: promotion };
    if (['S1', 'S2', 'S3'].includes(promotion)) {
      query.class = group;
    } else {
      query.combination = group;
    }

    const students = await Student.find(query);
    const userIds = students.map(s => s.user).filter(Boolean);
    const bookings = await Booking.find({ user: { $in: userIds } });

    const csvData = students.map(s => {
      const booking = bookings.find(b => b.user.toString() === (s.user || '').toString());
      return {
        Name: s.name,
        Urubuto: s.urubutoCode,
        Destination: booking ? booking.destination : '',
        Status: booking ? booking.status : 'Not Paid'
      };
    });

    const fields = [
      { label: 'Name', value: 'Name' },
      { label: 'Urubuto Code', value: 'Urubuto' },
      { label: 'Destination', value: 'Destination' },
      { label: 'Status', value: 'Status' }
    ];
    const parser = new Parser({ fields });
    const csv = parser.parse(csvData);

    res.header('Content-Type', 'text/csv');
    res.attachment(`promotion-${promotion}-${group}.csv`);
    res.send(csv);
  } catch (err) {
    logger.error('Failed to export class list CSV', { error: err.message });
    res.status(500).render('error', { error: err, message: 'Failed to export class list' });
  }
};
