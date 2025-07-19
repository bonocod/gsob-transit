const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  _id: String,
  name: String,
  promotion: { type: String, index: true },
  class: { type: String, index: true },
  combination: { type: String, default: null, index: true },
  email: String,
});

module.exports = mongoose.model('Student', studentSchema);