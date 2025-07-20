const express = require('express');
const { validate, schemas } = require('../middleware/validate');
const bookingController = require('../controllers/bookingController');

const router = express.Router();

// Show booking form
router.get('/', bookingController.getBooking);

// Handle booking submission
router.post('/', validate(schemas.booking), bookingController.createBooking);

module.exports = router;