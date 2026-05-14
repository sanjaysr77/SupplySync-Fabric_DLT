'use strict';

const { Router } = require('express');

const router = Router();

router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Admin / org routes (Phase 1 — implement in later phases)',
  });
});

module.exports = router;
