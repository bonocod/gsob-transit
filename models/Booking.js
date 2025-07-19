const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    destination: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    phone: {
        type: String,
        required: true
    }
}, { timestamps: true });

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
