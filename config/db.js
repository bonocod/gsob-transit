const mongoose = require('mongoose');
const logger = require('./logger');

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is not defined in .env file');
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    logger.info('MongoDB connected', { timestamp: new Date().toISOString() });
  } catch (err) {
    logger.error('MongoDB connection error', { error: err.message });
    process.exit(1);
  }
};

module.exports = connectDB;