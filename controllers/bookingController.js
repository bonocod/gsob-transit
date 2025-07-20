const Booking = require('../models/Booking');
const Destination = require('../models/Destination');
const Student = require('../models/Student');
const logger = require('../config/logger');

exports.getBooking = async (req, res) => {
  try {
    const destinations = await Destination.find();
    let studentData = {};
    if (req.session.user && req.session.user.id) {
      const student = await Student.findOne({ user: req.session.user.id });
      if (student) {
        studentData = {
          name: student.name,
          promotion: student.promotion,
          class: student.class,
          combination: student.combination
        };
      } else {
        logger.warn('No student record found for user', { userId: req.session.user.id });
      }
    } else {
      logger.warn('No user session found');
    }
    res.render('booking', {
      csrfToken: req.csrfToken(),
      destinations,
      user: req.session.user || {},
      student: studentData,
      errorMessage: null
    });
  } catch (err) {
    logger.error('Error fetching booking page', { error: err.message });
    res.render('booking', {
      errorMessage: 'Failed to load booking page',
      csrfToken: req.csrfToken(),
      destinations: [],
      user: req.session.user || {},
      student: {}
    });
  }
};

exports.createBooking = async (req, res) => {
  const { destination, date, phoneNumber } = req.body;
  const userId = req.session.user.id;

  try {
    // Check booking limit (max 1)
    const existingBookings = await Booking.countDocuments({ user: userId });
    if (existingBookings >= 1) {
      logger.warn('Booking limit reached', { userId });
      return res.redirect('/ticket-failure?message=You have already booked a ticket.');
    }

    // Validate inputs
    if (!destination || !date || !phoneNumber) {
      throw new Error('All fields are required');
    }

    const booking = new Booking({
      user: userId,
      destination,
      phoneNumber,
      date,
      status: 'pending'
    });
    await booking.save();

    logger.info('Booking created', { userId, destination, date, phoneNumber });
    res.redirect('/ticket-success');
  } catch (err) {
    logger.error('Error creating booking', { error: err.message, userId });
    res.redirect(`/ticket-failure?message=${encodeURIComponent(err.message || 'Failed to create booking')}`);
  }
};