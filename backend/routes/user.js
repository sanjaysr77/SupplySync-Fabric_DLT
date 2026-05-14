'use strict';

const { Router } = require('express');
const {
  getProfile,
  updateProfile,
  listUsers,
  getUserById,
  deleteUser,
} = require('../controllers/userController');
const { protect, requireRole } = require('../middleware/auth');

const router = Router();

router.get('/profile', protect, getProfile);
router.get('/me', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.get('/list', protect, requireRole('admin'), listUsers);
router.get('/:id', protect, getUserById);
router.delete('/:id', protect, requireRole('admin'), deleteUser);

module.exports = router;
