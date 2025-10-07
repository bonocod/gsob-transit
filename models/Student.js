const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  name: { type: String, required: true },
  studentCode: { type: String, required: true, unique: true, minlength: 4, maxlength: 4 },
  promotion: { type: String, required: true, enum: ['S1', 'S2', 'S3', 'S4', 'S5', 'S6'] },
  class: {
    type: String,
    required: function() { return ['S1', 'S2', 'S3'].includes(this.promotion); },
    enum: ['A', 'B', 'C', 'D','E']
  },
  combination: {
    type: String,
    required: function() { return ['S4', 'S5', 'S6'].includes(this.promotion); },
    enum: ['MS1 A', 'MS1 B', 'MS1 C', 'MS2','MS1 D', 'ANP','ANP A','ANP B', 'MCB', 'MPC', 'PCM', 'PCB A', 'PCB B', 'PCB C']
  }
});

module.exports = mongoose.model('Student', studentSchema);