const express = require('express');
require('dotenv').config();
const path = require('path');
const mongoose = require('mongoose');
const session = require('express-session');
const csurf = require('csurf');
const authMiddleware = require('./middleware/auth');
const isAdmin = require('./middleware/isAdmin');
const adminRoutes = require('./routes/admin');

const app = express();

// Database connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB');
}).catch(err => {
    console.error('MongoDB connection error:', err);
});

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Session and CSRF
app.use(session({
    secret: process.env.SESSION_SECRET || 'secretkey',
    resave: false,
    saveUninitialized: false,
    // Consider setting cookie: { secure: true, sameSite: true } in production
}));
app.use(csurf());

app.use((req, res, next) => {
    res.locals.csrfToken = req.csrfToken();
    // Pass user to views if needed
    res.locals.currentUser = req.session.user;
    next();
});

// Routes
const authRoutes = require('./routes/auth');
const bookingRoutes = require('./routes/booking');

app.use('/auth', authRoutes);
app.use('/booking', bookingRoutes);

app.use('/admin', authMiddleware, isAdmin, adminRoutes);

// Root route
app.get('/', (req, res) => {
    res.render('index');
});

// Error handling
// 404 Not Found
app.use((req, res, next) => {
    res.status(404).render('404', { message: 'Page Not Found' });
});

// Centralized error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    if (err.code === 'EBADCSRFTOKEN') {
        // CSRF token errors
        return res.status(403).render('error', { message: 'Form tampered with.' });
    }
    res.status(err.status || 500).render('error', { message: err.message || 'Internal Server Error' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;
