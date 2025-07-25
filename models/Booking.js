const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  destination: {
    type: String,
    required: true
  },
  phoneNumber: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'paid'],
    default: 'paid' // You can keep this if all bookings are paid immediately
  },
  price: {
    type: Number,
    required: true
  },
  bookedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

bookingSchema.index({ user: 1, destination: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
