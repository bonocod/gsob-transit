const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  destination: String,
  amountPaid: Number,
  phone: String,
  status: { type: String, default: 'pending' }, // pending, confirmed, failed
  bookedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Booking', bookingSchema);
