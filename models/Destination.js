const mongoose = require('mongoose');

const destinationSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  price: { type: Number, required: true } // changed from String to Number
});

destinationSchema.index({ name: 1 });

module.exports = mongoose.model('Destination', destinationSchema);
