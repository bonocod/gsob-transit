const express = require('express');
const router = express.Router();

const Student = require('../models/Student');
const Booking = require('../models/Booking');
const Destination = require('../models/Destination');

router.get('/dashboard',   (req, res) => {
  res.render('admin', { user: req.user });
});


router.get('/summary', async (req, res) => {
  try {
    // Per-promotion + destination
    const summary = await Student.aggregate([
      {
        $lookup: {
          from: "bookings",
          localField: "_id",
          foreignField: "user",
          as: "bookings"
        }
      },
      { $unwind: { path: "$bookings", preserveNullAndEmptyArrays: true } },
      { $match: { "bookings.status": "paid" } },
      {
        $group: {
          _id: {
            promotion: "$promotion",
            destination: "$bookings.destination"
          },
          studentsSet: { $addToSet: "$_id" },
          totalPaid: { $sum: { $ifNull: ["$bookings.amountPaid", 0] } }
        }
      },
      {
        $project: {
          promotion: "$_id.promotion",
          destination: "$_id.destination",
          numberOfStudents: { $size: "$studentsSet" },
          totalPaid: 1,
          _id: 0
        }
      },
      { $sort: { promotion: 1, destination: 1 } }
    ]);

    // Per-destination (all promotions)
    const overallPerDestination = await Student.aggregate([
      {
        $lookup: {
          from: "bookings",
          localField: "_id",
          foreignField: "user",
          as: "bookings"
        }
      },
      { $unwind: { path: "$bookings", preserveNullAndEmptyArrays: true } },
      { $match: { "bookings.status": "paid" } },
      {
        $group: {
          _id: "$bookings.destination",
          studentsSet: { $addToSet: "$_id" },
          totalPaid: { $sum: { $ifNull: ["$bookings.amountPaid", 0] } }
        }
      },
      {
        $project: {
          promotion: "All",
          destination: "$_id",
          numberOfStudents: { $size: "$studentsSet" },
          totalPaid: 1,
          _id: 0
        }
      },
      { $sort: { destination: 1 } }
    ]);

    // Get individual paid students
    const paidStudents = await Booking.aggregate([
      { $match: { status: 'paid' } },
      {
        $lookup: {
          from: 'students',
          localField: 'user',
          foreignField: '_id',
          as: 'student'
        }
      },
      { $unwind: '$student' },
      {
        $project: {
          fullName: "$student.fullName",
          promotion: "$student.promotion",
          class: "$student.class",
          destination: "$destination",
          phone: "$phone",
          amountPaid: 1,
          bookedAt: 1
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
    console.error('Aggregation error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// --- Step 1: Route File to Handle Promotion and Class-Level Student Management ---




// Route to show available classes/combinations for a given promotion
router.get('/manage/:promotion', async (req, res) => {
  try {
    const promotion = req.params.promotion.toUpperCase();
    const isO = ['S1','S2','S3'].includes(promotion);
    const field = isO ? 'class' : 'combination';

    // get distinct values (A–D or ANP, etc.)
    const items = await Student.distinct(field, { promotion });
    res.render('manage-classes', { promotion, items });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// ———————————————————————————————————————————————
// 3) Show student list for that class/combination
router.get('/manage/:promotion/:item', async (req, res) => {
  try {
    const promotion = req.params.promotion.toUpperCase();
    const item = req.params.item; // class or combination

    // fetch all students in that group
    const students = await Student.aggregate([
      { $match: {
          promotion,
          $or: [
            { class: item },
            { combination: item }
          ]
      }},
      { $lookup: {
          from: 'bookings',
          localField: '_id',
          foreignField: 'user',
          as: 'bookings'
      }},
      { $addFields: {
          paid: { $gt: [{ $size: '$bookings' }, 0] },
          destination: { $arrayElemAt: ['$bookings.destination', 0] },
          bookedAt: { $arrayElemAt: ['$bookings.bookedAt', 0] }
      }},
      { $project: {
          name: '$name',
          paid: 1,
          destination: 1,
          bookedAt: 1
      }}
    ]);

    const total    = students.length;
    const paidCount   = students.filter(s => s.paid).length;
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
    console.error(err);
    res.status(500).send('Server error');
  }
});

const { Parser } = require('json2csv');

router.get('/export/summary', async (req, res) => {
  try {
    
    const summary = await Student.aggregate([
  {
    $lookup: {
      from: "bookings",
      localField: "_id",
      foreignField: "user",
      as: "booking"
    }
  },
  {
    $unwind: "$booking"
  },
  {
    $group: {
      _id: {
        promotion: "$promotion",
        destination: "$booking.destination"
      },
      studentsSet: { $addToSet: "$_id" }, // unique students
      totalPaid: { $sum: "$booking.amountPaid" }
    }
  },
  {
    $project: {
      promotion: "$_id.promotion",
      destination: "$_id.destination",
      numberOfStudents: { $size: "$studentsSet" },
      totalPaid: 1,
      _id: 0
    }
  },
  {
    $sort: { promotion: 1, destination: 1 }
  }
]);

    const parser = new Parser();
    const csv = parser.parse(summary);
    
    res.header('Content-Type', 'text/csv');
    res.attachment('summary.csv');
    return res.send(csv);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error exporting summary');
  }
});



module.exports = router;