const express = require('express');
const studentController = require('../controllers/studentController');

const router = express.Router();

router.post('/verify-code', studentController.verifyCode);
router.post('/confirm-student', studentController.confirmStudent);

module.exports = router;