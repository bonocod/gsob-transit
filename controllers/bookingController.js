const Booking = require('../models/Booking');
const destinations = require('../config/destinationPrices');

exports.showForm = async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/auth/login');
    }
    const existingBooking = await Booking.findOne({ user: req.session.user.id });
    if (existingBooking) {
        return res.render('booked-user', { user, destinations: await Destination.find(), message: 'You have already booked a ticket.' });
    }
    res.render('booking', { user:req.session.user,destinations ,errorMessage:null });
};

exports.create = async (req, res, next) => {
    try {
        if (!req.session.user) {
            return res.redirect('/auth/login');
        }
        const { destination, date, phone } = req.body;
        const selected = destinations.find(d => d.name === destination);
        if (!selected) {
            return res.status(400).render('error', { message: 'Invalid destination selected.' });
        }
        const price = selected.price;
        const booking = new Booking({
            user: req.session.user.id,
            destination,
            price,
            date,
            phone
        });
        await booking.save();
        res.redirect('/');
    } catch (err) {
        next(err);
    }
};
