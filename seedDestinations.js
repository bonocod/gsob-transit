require('dotenv').config();
const mongoose = require('mongoose');
const Destination = require('./models/Destination');
const logger = require('./config/logger');

const destinations = [
  { name: 'Huye-Kigali', price: 3800 },
  { name: 'Huye-Musanze', price: 4500 },
  { name: 'Huye-Rusizi', price: 5000 },
  { name: 'Huye-Muhanga', price: 4200 }
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    await Destination.deleteMany({});
    await Destination.insertMany(destinations);
    logger.info('Destinations seeded successfully');
  } catch (err) {
    logger.error('Failed to seed destinations', { error: err.message });
    throw err;
  } finally {
    await mongoose.disconnect();
  }
};

seed();