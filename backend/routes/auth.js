'use strict';

const { Router } = require('express');
const {
  login,
  register,
  getMe,
  changePassword,
  completeRegistration,
  createUserAsAdmin,
} = require('../controllers/authController');
const { protect, requireRole } = require('../middleware/auth');

const router = Router();

router.post('/login', login);
router.post('/register', protect, requireRole('admin'), register);
router.post('/create-user', protect, requireRole('admin'), createUserAsAdmin);
router.get('/me', protect, getMe);
router.put('/password', protect, changePassword);
router.post('/complete-registration', completeRegistration);

module.exports = router;
