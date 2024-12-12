const express = require('express');
const adminController = require('../controllers/adminController');
const router = express.Router();

router.post('/signup', adminController.signupAdmin);
router.post('/login', adminController.loginAdmin);
router.post('/approveUser', adminController.approveUser);
router.get('/getPendingUsers', adminController.listPendingUsers);

module.exports = router;
