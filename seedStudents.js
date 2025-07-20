const mongoose = require('mongoose');
const Student = require('./models/Student');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI);

const students = [];
for (let i = 0; i < 1000; i++) {
  const urubutoCode = Math.floor(10000 + (i % 90000)).toString(); // Generates 10000 to 99999
  const promotion = String((i % 6) + 1); // Cycle through 1-6
  students.push({
    _id: `S${String(i + 1).padStart(4, '0')}`, // e.g., S0001 to S1000
    name: `Student ${i + 1}`,
    urubutoCode,
    email: `student${i + 1}@gsob.com`,
    promotion,
    ...(promotion <= '3' ? { class: ['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)] } : { combination: ['MPC', 'MCB', 'ANP', 'PCBa', 'PCBb', 'PCM'][Math.floor(Math.random() * 6)] })
  });
}

Student.insertMany(students)
  .then(() => console.log('1000 students seeded'))
  .catch(err => console.error('Error seeding students:', err))
  .finally(() => mongoose.connection.close());