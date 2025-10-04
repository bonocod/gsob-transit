const express = require('express');
const bookingController = require('../controllers/bookingController');
const router = express.Router();
// Show booking form or details
router.get('/', bookingController.getBooking);
// Handle booking submission
router.post('/', bookingController.createBooking);
module.exports = router;