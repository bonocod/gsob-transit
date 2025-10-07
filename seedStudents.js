require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const Student = require('./models/Student');
const logger = require('./config/logger');
// Constants for modularity
const PROMOTION_PREFIXES = {
'S1': 1,
'S2': 2,
'S3': 3,
'S4': 4,
'S5': 5,
'S6': 6
};
const CODE_PADDING = 3; // For 3-digit padding, e.g., 1001
// Function to load JSON data
const loadStudents = (filePath) => {
try {
const data = fs.readFileSync(filePath, 'utf-8');
return JSON.parse(data);
} catch (err) {
logger.error('Failed to load student JSON', { error: err.message });
throw err;
}
};
// Function to generate unique student code
const generateStudentCode = (promotion, index) => {
const prefix = PROMOTION_PREFIXES[promotion];
if (!prefix) {
throw new Error(`Invalid promotion: ${promotion}`);
}
return `${prefix}${String(index + 1).padStart(CODE_PADDING, '0')}`;
};
// Function to prepare student object
const prepareStudent = (studentData, index) => {
const promotion = studentData.promotion;
const groupField = ['S1', 'S2', 'S3'].includes(promotion) ? 'class' : 'combination';
return {

name: studentData.name,
studentCode: generateStudentCode(promotion, index),
promotion: promotion,
[groupField]: studentData[groupField] // Dynamically add class or combination
};
};
// Main seeding function
const seed = async () => {
try {
await mongoose.connect(process.env.MONGO_URI);
await Student.deleteMany({});
const allStudents = loadStudents('./student-list.json');
// Group by promotion for counting and validation
const grouped = allStudents.reduce((acc, s) => {
acc[s.promotion] = (acc[s.promotion] || 0) + 1;
return acc;
}, {});
logger.info('Student counts by promotion', grouped);
const studentsToInsert = allStudents.map((s, i) => prepareStudent(s, i));
await Student.insertMany(studentsToInsert);
logger.info('All students seeded successfully');
} catch (err) {
logger.error('Failed to seed students', { error: err.message });
throw err;
} finally {
await mongoose.disconnect();
}
};
seed();