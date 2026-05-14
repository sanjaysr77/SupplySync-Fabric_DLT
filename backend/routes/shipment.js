'use strict';

const { Router } = require('express');

const router = Router();

router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Shipment routes (Phase 1 — chaincode: shipment on mychannel)',
  });
});

module.exports = router;
