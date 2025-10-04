const mongoose = require('mongoose');
const Destination = require('./models/Destination');
const connectDB = require('./config/db');
const logger = require('./config/logger');
require('dotenv').config();

const destinations = [
  { name: 'Kigali', price: 5000 },
  { name: 'Muhanga', price: 3000 },
  { name: 'Huye', price: 7000 },
  { name: 'Rusizi', price: 10000 },
  { name: 'Musanze', price: 6000 }
];

async function seed() {
  try {
    await connectDB();
    await Destination.deleteMany({});
    await Destination.insertMany(destinations);
    logger.info('Destinations seeded successfully', { timestamp: new Date().toISOString() });
    process.exit(0);
  } catch (err) {
    logger.error('Error seeding destinations', { error: err.message });
    process.exit(1);
  }
}

seed();