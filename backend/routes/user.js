'use strict';

const { Router } = require('express');
const { protect } = require('../middleware/auth');

const router = Router();

router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'User routes (Phase 1)',
  });
});

router.get('/me', protect, (req, res) => {
  res.json({ success: true, user: req.user });
});

module.exports = router;
