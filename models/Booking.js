const mongoose = require('mongoose');
const bookingSchema = new mongoose.Schema({
student: {
type: String,
ref: 'Student',
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
status: {
type: String,
enum: ['pending', 'paid'],
default: 'pending'
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
bookingSchema.index({ student: 1, destination: 1 });
module.exports = mongoose.model('Booking', bookingSchema);