'use strict';

const { Router } = require('express');
const {
  createShipment,
  updateShipmentStatus,
  listShipments,
  getShipmentById,
  trackShipment,
} = require('../controllers/shipmentController');
const { protect, requireBlockchainAccess } = require('../middleware/auth');

const router = Router();

router.post('/create', protect, requireBlockchainAccess, createShipment);
router.get('/list', protect, requireBlockchainAccess, listShipments);
router.get('/:id/track', protect, requireBlockchainAccess, trackShipment);
router.get('/:id', protect, requireBlockchainAccess, getShipmentById);
router.put('/:id/status', protect, requireBlockchainAccess, updateShipmentStatus);

module.exports = router;
