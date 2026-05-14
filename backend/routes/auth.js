'use strict';

const { Router } = require('express');

const router = Router();

router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Auth routes (Phase 1 — implement login/register in Phase 3)',
  });
});

module.exports = router;
