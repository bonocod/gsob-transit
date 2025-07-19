// createAdmin.js
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const createAdmin = async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const password = 'umuntu'; // set your admin password here
  const hashedPassword = await bcrypt.hash(password, 12);

  const admin = new User({
    name: 'yego sha',
    studentId: 'admin001',
    email: 'admin@gmail.com',
    password: hashedPassword,
    role: 'admin'
  });

  await admin.save();
  console.log('✅ Admin created!');
  mongoose.disconnect();
};

createAdmin();
