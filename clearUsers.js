const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI);

User.deleteMany({})
  .then(() => console.log('User collection cleared'))
  .catch(err => console.error('Error clearing users:', err))
  .finally(() => mongoose.connection.close());