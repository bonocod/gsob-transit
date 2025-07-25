// routes/admin.js
const express = require('express');
const adminController = require('../controllers/adminController');
const router = express.Router();

// Admin Dashboard and Summary
router.get('/dashboard', adminController.dashboard);
router.get('/summary', adminController.summary);

// Booking Management
router.get('/bookings', adminController.bookings);
router.post('/bookings/:id/paid', adminController.markPaid);

// Manage Promotions and Classes
router.get('/manage/:promotion', adminController.manageClasses);
router.get('/manage/:promotion/:group', adminController.classStudents);

// CSV Exports
router.get('/export/summary', adminController.exportSummary);
router.get('/export/:promotion/:group', adminController.exportClassList);

module.exports = router;
