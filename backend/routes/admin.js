'use strict';

const { Router } = require('express');
const {
  createOrganization,
  listOrganizations,
  createRole,
  assignRole,
  getSystemStats,
} = require('../controllers/adminController');
const { protect, requireRole } = require('../middleware/auth');

const router = Router();

router.post('/organizations', protect, requireRole('admin'), createOrganization);
router.get('/organizations', protect, requireRole('admin'), listOrganizations);
router.post('/roles', protect, requireRole('admin'), createRole);
router.post('/assign-role', protect, requireRole('admin'), assignRole);
router.get('/stats', protect, requireRole('admin'), getSystemStats);

module.exports = router;
