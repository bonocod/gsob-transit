const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const isAdmin = require('../middleware/isAdmin');

router.get('/dashboard', isAdmin, adminController.dashboard);
router.get('/summary', isAdmin, adminController.summary);
router.get('/bookings', isAdmin, adminController.bookings);
router.get('/manage/:promotion', isAdmin, adminController.manageClasses);
router.get('/manage/:promotion/:group', isAdmin, adminController.classStudents);
router.get('/export-summary', isAdmin, adminController.exportSummary);
router.get('/export/:promotion/:group', isAdmin, adminController.exportClassList);
router.put('/bookings/:id/mark-paid', isAdmin, adminController.markPaid);

module.exports = router;