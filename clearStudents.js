const mongoose = require('mongoose');
const Student = require('./models/Student');
require('dotenv').config();
mongoose.connect(process.env.MONGO_URI);
Student.deleteMany({})
.then(() => console.log('Student collection cleared'))
.catch(err => console.error('Error clearing students:', err))
.finally(() => mongoose.connection.close());