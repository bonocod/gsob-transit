import mongoose from 'mongoose';
import Student from './models/Student.js';
import Booking from './models/Booking.js';
import User from './models/User.js';

await mongoose.connect('mongodb+srv://Bonheur:Arabizi4@cluster0.ya5csm1.mongodb.net/gsob-transit?retryWrites=true&w=majority&appName=Cluster0');

const student = await Student.findOne({ urubutoCode: '10002' }).populate('user');


console.log("Student:", student?.name || 'Not Found');
console.log("Student.user:", student?.user || 'No user linked');

if (!student || !student.user) {
  console.log("❌ This student is not linked to any user.");
  process.exit();
}

const booking = await Booking.findOne({ user: student.user._id });

if (booking) {
  console.log("✅ Booking found:");
  console.log("Destination:", booking.destination);
  console.log("Status:", booking.status);
  console.log("Booked At:", booking.date);
} else {
  console.log("❌ No booking found for this student.");
}

await mongoose.disconnect();
process.exit();



