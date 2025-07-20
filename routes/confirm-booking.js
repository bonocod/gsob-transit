const express = require('express');
const { validate, schemas } = require('../middleware/validate');
const Booking = require('../models/Booking');
const Destination = require('../models/Destination');
const logger = require('../config/logger');

const router = express.Router();

router.post('/', validate(schemas.booking), async (req, res) => {
  try {
    if (!req.user || !req.user.id || !req.user.name) {
      logger.error('User not authenticated', { user: req.user });
      return res.status(403).render('error', { message: 'User not authenticated' });
    }

    const { destination, phone } = req.body;
    const selected = await Destination.findOne({ name: destination });
    if (!selected) {
      logger.error('Invalid destination', { destination });
      return res.status(400).render('ticket-confirmation', {
        user: req.user,
        errorMessage: 'Invalid destination selected',
        destination,
        csrfToken: req.csrfToken()
      });
    }

    const existing = await Booking.findOne({ user: req.user.id });
    if (existing) {
      logger.warn('Booking already exists', { userId: req.user.id });
      return res.status(400).render('booked-user', {
        user: req.user,
        destinations: await Destination.find(),
        message: 'You have already booked a ticket.',
        csrfToken: req.csrfToken()
      });
    }

    const booking = new Booking({
      user: req.user.id,
      destination: selected.name,
      price: selected.price,
      phone,
      status: 'confirmed',
      bookedAt: new Date()
    });

    await booking.save();
    logger.info('Booking confirmed', { userId: req.user.id, destination });

    res.redirect(`/ticket-success?fullName=${encodeURIComponent(req.user.name)}&destination=${encodeURIComponent(selected.name)}&price=${selected.price}&phoneNumber=${encodeURIComponent(phone)}`);
  } catch (error) {
    logger.error('Error in confirm-booking', { error: error.message });
    res.status(500).render('error', { message: 'Server error. Please try again.' });
  }
});

module.exports = router;