const mongoose = require('mongoose');
const Booking = require('./models/Booking');
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

async function cleanBookings() {
  try {
    const result = await Booking.deleteMany({
      $or: [
        { destination: { $exists: false } },
        { destination: null },
        { destination: "" }
      ]
    });

    console.log(`Deleted ${result.deletedCount} bookings without a destination.`);
  } catch (error) {
    console.error("Error cleaning bookings:", error);
  } finally {
    mongoose.connection.close();
  }
}

cleanBookings();
