'use strict';

const { Router } = require('express');

const router = Router();

router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Purchase order routes (Phase 1 — chaincode: purchaseorder on mychannel)',
  });
});

module.exports = router;
