const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  _id: String,         // user ID like "user0001"
  name: String,
  promotion: String,
  class: String,
  combination: { type: String, default: null },
  email: String,
});

module.exports = mongoose.model('Student', studentSchema);
