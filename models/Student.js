const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: false
  },
  urubutoCode: {
    type: String,
    required: true,
    unique: true
  },
  promotion: {
    type: String,
    required: true,
    enum: ['1', '2', '3', '4', '5', '6']
  },
  class: {
    type: String,
    required: function() { return ['1', '2', '3'].includes(this.promotion); },
    enum: ['A', 'B', 'C', 'D']
  },
  combination: {
    type: String,
    required: function() { return ['4', '5', '6'].includes(this.promotion); },
    enum: ['MPC', 'MCB', 'ANP', 'PCBa', 'PCBb', 'PCM']
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  phone: {
    type: String,
    required: false
  }
});

module.exports = mongoose.model('Student', studentSchema);