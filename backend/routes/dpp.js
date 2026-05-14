'use strict';

const { Router } = require('express');

const router = Router();

router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'DPP routes (Phase 1 — chaincode: dppcontract on mychannel)',
  });
});

module.exports = router;
