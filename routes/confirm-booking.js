// routes/confirm-booking.js
const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');

router.post('/', async (req, res) => {
    console.log('Received booking data:', req.body);
    const { destination, phoneNumber } = req.body;

    if (!req.user || !req.user.id || !req.user.name) {
        console.error('User not authenticated or missing fields:', req.user);
        return res.status(403).send('User not authenticated');
    }
    if (!destination || !phoneNumber) {
        console.error('Missing destination or phone number:', { destination, phoneNumber });
        return res.status(400).send('Destination and phone number are required');
    }

    try {
        // Enforce one booking per student
        const existing = await Booking.findOne({ user: req.user.id });
        if (existing) {
            console.error('Booking attempt when one already exists:', existing);
            return res.status(400).send('You have already booked a ticket.');
        }

        // Parse destination string ("LocationPriceRWF")
        const destinationParts = destination.split(' ');
        if (destinationParts.length < 2) {
            throw new Error('Invalid destination format: ' + destination);
        }
        const priceString = destinationParts[1];
        const price = parseFloat(priceString.replace('RWF', ''));
        if (isNaN(price)) {
            throw new Error('Invalid price format in destination: ' + priceString);
        }

        // Create and save the booking
        const booking = new Booking({
            user: req.user.id,
            destination: destinationParts[0],
            phone: phoneNumber,
            amountPaid: price,
            status: 'confirmed',
            bookedAt: new Date()
        });

        await booking.save();
        console.log('Booking saved:', booking);

        // Redirect to success page with ticket details
        res.redirect(`/ticket-success?fullName=${encodeURIComponent(req.user.name)}` +
                     `&destination=${encodeURIComponent(destination)}` +
                     `&phoneNumber=${encodeURIComponent(phoneNumber)}`);
    } catch (error) {
        console.error('Error in confirm-booking:', error);
        res.status(500).send('Server error. Please try again.');
    }
});

module.exports = router;
