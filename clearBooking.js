const mongoose = require('mongoose');
const Booking = require('./models/Booking');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI);

Booking.deleteMany({})
  .then(() => console.log('Booking collection cleared'))
  .catch(err => console.error('Error clearing bookings:', err))
  .finally(() => mongoose.connection.close());