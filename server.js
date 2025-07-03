const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const authMiddleware = require('./middleware/auth');
const isAdmin = require('./middleware/isAdmin');
const User = require('./models/User');
const adminRoutes = require('./routes/admin');
const confirmBookingRoute = require('./routes/confirm-booking');
dotenv.config();
const app = express();

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.set('views', './views');
app.set('strict routing', false);

// Debug middleware to log all incoming requests
app.use((req, res, next) => {
    console.log(`Incoming request: ${req.method} ${req.url} from ${req.headers['user-agent']}`);
    next();
});

// Connect MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

// Move /confirm-booking routes higher
if (typeof confirmBookingRoute !== 'function') {
    console.error('Error: confirmBookingRoute is not a function:', confirmBookingRoute);
    throw new Error('confirm-booking.js must export a router function');
}
app.use('/confirm-booking', authMiddleware,confirmBookingRoute );


// Auth Routes
const authRoutes = require('./routes/auth');
if (typeof authRoutes !== 'function') {
    console.error('Error: authRoutes is not a function:', authRoutes);
    throw new Error('auth.js must export a router function');
}
app.use('/api/auth', authRoutes);

// Admin Routes
if (typeof adminRoutes !== 'function') {
    console.error('Error: adminRoutes is not a function:', adminRoutes);
    throw new Error('admin.js must export a router function');
}
app.use('/admin', authMiddleware, isAdmin, adminRoutes);

// Public pages
app.get('/', (req, res) => {
    console.log('Accessing / route');
    res.render('home');
});
app.get('/login', (req, res) => {
    console.log('Accessing /login route');
    res.render('login', { error: '' });
});
app.get('/register', (req, res) => {
    console.log('Accessing /register route');
    res.render('register', { error: '' });
});

// Student dashboard
app.get('/booking', authMiddleware, async (req, res) => {
    console.log('Accessing /booking route');
    if (!req.user) {
        return res.redirect('/login');
    }
    if (req.user.role !== 'student') {
        return res.status(403).send('Only students can access this.');
    }
    const user = await User.findById(req.user.id);
    if (!user) {
        return res.status(404).send('User not found');
    }
    res.render('booking', { user });
});

// Bookings
app.get('/book-ticket', authMiddleware, (req, res) => {
    console.log('Accessing /book-ticket route');
    if (!req.user) {
        console.error('User not authenticated');
        return res.redirect('/login');
    }
    console.log('req.user:', req.user);
    const destination = req.query.destination;
    if (!destination) {
        console.log('No destination provided');
        return res.redirect('/booking');
    }
    res.render('ticket-confirmation', { user: req.user, destination });
});

// Success page
app.get('/ticket-success', (req, res) => {
    console.log('Accessing /ticket-success route');
    const { fullName, destination, phoneNumber } = req.query;
    res.render('ticket-success', { fullName, destination, phoneNumber });
});

// Logout
app.get('/logout', (req, res) => {
    console.log('Accessing /logout route');
    res.clearCookie('token');
    res.redirect('/login');
});

//404 handler for unmatched routes
app.use((req, res) => {
    console.log(`404: Unmatched route ${req.method} ${req.url}`);
    res.status(404).send('404 page not found');
});

const PORT = process.env.POR9T||5500;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

