'use strict';

const { Router } = require('express');

const router = Router();

router.get('/', (req, res) => {
  res.json({ success: true, message: 'Role routes (Phase 1)' });
});

module.exports = router;
