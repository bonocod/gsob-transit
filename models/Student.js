const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  name: { type: String, required: true },
  studentCode: { type: String, required: true, unique: true, minlength: 4, maxlength: 4 },
  promotion: { type: String, required: true, enum: ['S1', 'S2', 'S3', 'S4', 'S5', 'S6'] },
  class: {
    type: String,
    required: function() { return ['S1', 'S2', 'S3'].includes(this.promotion); },
    enum: ['A', 'B', 'C', 'D']
  },
  combination: {
    type: String,
    required: function() { return ['S4', 'S5', 'S6'].includes(this.promotion); },
    enum: ['MS1A', 'MS1B', 'MS1C', 'MS2', 'anp', 'mcb', 'mpc', 'pcm', 'PCBA', 'PCBB', 'PCBa', 'PCBb', 'PCBc']
  }
});

module.exports = mongoose.model('Student', studentSchema);