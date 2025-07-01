// routes/confirm-booking.js
const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');

// In routes/confirm-booking.js
router.post('/', async (req, res) => {
    console.log('Received destination:', req.body.destination); // Debug log
    const { destination, phoneNumber } = req.body;

    if (!req.user || !req.user.id || !req.user.name) {
        console.error('User not authenticated or missing required fields:', req.user);
        return res.status(403).send('User not authenticated');
    }

    if (!destination || !phoneNumber) {
        console.error('Missing destination or phone number:', { destination, phoneNumber });
        return res.status(400).send('Destination and phone number are required');
    }

    try {
        const destinationParts = destination.split(' ');
        if (destinationParts.length < 2) {
            throw new Error('Invalid destination format: expected "location price", got ' + destination);
        }

        const priceString = destinationParts[1];
        const price = parseFloat(priceString.replace('RWF', ''));
        if (isNaN(price)) {
            throw new Error('Invalid price format in destination: ' + priceString);
        }

        const booking = new Booking({
            user: req.user._id,
            destination: destinationParts[0],
            phoneNumber,
            amountPaid: price,
            status: 'confirmed',
            bookedAt: new Date()
        });

        await booking.save();
        console.log('Booking saved:', booking);

        res.redirect(`/ticket-success?fullName=${encodeURIComponent(req.user.name)}&destination=${encodeURIComponent(destination)}&phoneNumber=${encodeURIComponent(phoneNumber)}`);
    } catch (error) {
        console.error('Error in confirm-booking:', error);
        res.status(500).send('Server error. Please try again.');
    }
});

module.exports = router;