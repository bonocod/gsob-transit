const mongoose = require('mongoose');
const Student = require('./models/Student');
const User = require('./models/User');
require('dotenv').config();

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);

  // ⚠️ WARNING: Deletes all users and students!
  await User.deleteMany({});
  await Student.deleteMany({});

  const students = [];
  for (let i = 0; i < 1000; i++) {
    const urubutoCode = (10000 + i).toString(); // ✅ Starts from 10000
    const promotion = `S${(i % 6) + 1}`;         // S1 to S6

    students.push({
      _id: `S${String(i + 1).padStart(4, '0')}`,
      name: `Student ${i + 1}`,
      urubutoCode,
      email: `student${i + 1}@gsob.com`,
      promotion,
      ...(promotion <= 'S3'
        ? { class: ['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)] }
        : { combination: ['MPC', 'MCB', 'ANP', 'PCBa', 'PCBb', 'PCM'][Math.floor(Math.random() * 6)] }
      )
    });
  }

  await Student.insertMany(students);
  console.log('✅ 1000 students seeded from urubutoCode 10000 to 10999');

  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('❌ Error while seeding:', err);
  mongoose.disconnect();
});
