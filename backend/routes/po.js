'use strict';

const { Router } = require('express');
const {
  createPO,
  approvePO,
  rejectPO,
  listPOs,
  getPOById,
  updatePOStatus,
} = require('../controllers/poController');
const { protect, requireBlockchainAccess } = require('../middleware/auth');

const router = Router();

router.post('/create', protect, requireBlockchainAccess, createPO);
router.get('/list', protect, requireBlockchainAccess, listPOs);
router.get('/:id', protect, requireBlockchainAccess, getPOById);
router.put('/:id/approve', protect, requireBlockchainAccess, approvePO);
router.put('/:id/reject', protect, requireBlockchainAccess, rejectPO);
router.put('/:id/status', protect, requireBlockchainAccess, updatePOStatus);

module.exports = router;
