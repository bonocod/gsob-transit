const mongoose = require('mongoose');
const Destination = require('./models/Destination');
require('dotenv').config();

const destinations = [
    { name: 'Huye-Kigali', price: 3800 },
    { name: 'Huye-Musanze', price: 4500 },
    { name: 'Huye-Rusizi', price: 5000 },
    { name: 'Huye-Muhanga', price: 4200 },
];

async function seed() {
    await mongoose.connect(process.env.MONGO_URI);
    await Destination.deleteMany({});
    await Destination.insertMany(destinations);
    console.log('Destinations seeded');
    mongoose.disconnect();
}

seed();