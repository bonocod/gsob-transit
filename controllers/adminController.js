const Booking = require('../models/Booking');
const Student = require('../models/Student');
const logger = require('../config/logger');
const { Parser } = require('json2csv');

exports.dashboard = (req, res) => {
  res.render('admin', { user: req.session.admin });
};

exports.summary = async (req, res) => {
  try {
    const bookingsByPromoDest = await Booking.aggregate([
      { $match: { status: 'paid' } },
      {
        $lookup: {
          from: 'students',
          localField: 'student',
          foreignField: '_id',
          as: 'studentData'
        }
      },
      { $unwind: { path: '$studentData', preserveNullAndEmptyArrays: true } }, // Preserve null if no match
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
      const { promotion, destination } = item._id || { promotion: null, destination: null };
      if (!grouped[destination]) grouped[destination] = { numberOfStudents: 0, totalPaid: 0 };
      grouped[destination].numberOfStudents += item.numberOfStudents;
      grouped[destination].totalPaid += item.totalPaid;
    });

    const destinationSummary = bookingsByPromoDest.map(item => ({
      promotion: item._id?.promotion || 'Unknown',
      destination: item._id?.destination || 'Unknown',
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
      user: req.session.admin,
      destinationSummary
    });
  } catch (err) {
    logger.error('Failed to generate summary', { error: err.message });
    res.status(500).render('error', { error: err, message: 'Failed to load summary' });
  }
};

exports.bookings = async (req, res) => {
  try {
    const bookings = await Booking.find().populate('student');
    res.render('admin-bookings', { user: req.session.admin, bookings });
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
    items = ['A', 'B', 'C', 'D','E'];
  } else if (promotion === 'S4') {
    items = ['MS1 A', 'MS1 B', 'MS1 C', 'MS1 D','MS2','ANP A','ANP B'];
  } else if (promotion === 'S5') {
    items = ['ANP', 'MCB', 'MPC', 'PCM', 'PCB A', 'PCB B'];
  } else if (promotion === 'S6') {
    items = ['ANP', 'MCB', 'MPC', 'PCM', 'PCB A', 'PCB B', 'PCB C'];
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

    const students = await Student.find(query).sort({ name: 1 });

    const studentIds = students.map(s => s._id);
    const bookings = await Booking.find({ student: { $in: studentIds } });

    const bookingMap = {};
    bookings.forEach(b => {
      bookingMap[b.student.toString()] = b;
    });

    const studentData = students.map(s => {
      const booking = bookingMap[s._id.toString()];
      return {
        name: s.name,
        studentCode: s.studentCode,
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
      user: req.session.admin,
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
          localField: 'student',
          foreignField: '_id',
          as: 'studentData'
        }
      },
      { $unwind: { path: '$studentData', preserveNullAndEmptyArrays: true } },
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
      const { promotion, destination } = item._id || { promotion: null, destination: null };
      if (!grouped[destination]) grouped[destination] = { numberOfStudents: 0, totalPaid: 0 };
      grouped[destination].numberOfStudents += item.numberOfStudents;
      grouped[destination].totalPaid += item.totalPaid;
    });

    const destinationSummary = bookingsByPromoDest.map(item => ({
      promotion: item._id?.promotion || 'Unknown',
      destination: item._id?.destination || 'Unknown',
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

    const students = await Student.find(query).sort({ name: 1 });

    const studentIds = students.map(s => s._id);
    const bookings = await Booking.find({ student: { $in: studentIds } });

    const csvData = students.map(s => {
      const booking = bookings.find(b => b.student.toString() === s._id.toString());
      return {
        Name: s.name,
        StudentCode: s.studentCode,
        Destination: booking ? booking.destination : '-',
        Status: booking ? booking.status : 'Not Paid',
        BookedAt: booking ? new Date(booking.bookedAt).toLocaleString() : '-'
      };
    });

    const fields = [
      { label: 'Name', value: 'Name' },
      { label: 'Student Code', value: 'StudentCode' },
      { label: 'Destination', value: 'Destination' },
      { label: 'Status', value: 'Status' },
      { label: 'Booked At', value: 'BookedAt' }
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