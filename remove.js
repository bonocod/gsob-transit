require('dotenv').config();
const mongoose = require('mongoose');
const Booking = require('./models/Booking');
const logger = require('./config/logger');

const cleanBookings = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    const result = await Booking.deleteMany({
      $or: [
        { destination: { $exists: false } },
        { destination: null },
        { destination: '' }
      ]
    });
    logger.info(`Deleted ${result.deletedCount} invalid bookings`);
  } catch (err) {
    logger.error('Error cleaning bookings', { error: err.message });
    throw err;
  } finally {
    await mongoose.connection.close();
  }
};

cleanBookings();