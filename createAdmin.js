require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const logger = require('./config/logger');

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    if (!process.env.ADMIN_PASSWORD || !process.env.ADMIN_EMAIL) {
      throw new Error('ADMIN_PASSWORD and ADMIN_EMAIL must be defined in .env');
    }

    const existing = await User.findOne({ email: 'dmin@gsobutare.rw'});
    if (existing) {
      logger.info('Admin already exists');
      return;
    }

    const password = 'admin123';

    const hashedPassword = await bcrypt.hash(password, 12);
    const admin = new User({
      name: 'Admin',
      email: 'admin@gsobutare.rw',
      password: hashedPassword,
      role: 'admin'
    });

    await admin.save();
    logger.info('Admin created successfully');
  } catch (err) {
    logger.error('Failed to create admin', { error: err.message });
    throw err;
  } finally {
    await mongoose.connection.close();
  }
};

createAdmin();