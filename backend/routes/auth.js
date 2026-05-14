'use strict';

const { Router } = require('express');
const {
  login,
  register,
  getMe,
  changePassword,
  completeRegistration,
} = require('../controllers/authController');
const { protect, requireRole } = require('../middleware/auth');

const router = Router();

router.post('/login', login);
router.post('/register', protect, requireRole('admin'), register);
router.get('/me', protect, getMe);
router.put('/password', protect, changePassword);
router.post('/complete-registration', completeRegistration);

module.exports = router;
