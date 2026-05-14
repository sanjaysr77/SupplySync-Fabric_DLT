'use strict';

const { Router } = require('express');
const { authenticate } = require('../middleware/auth');

const router = Router();

/** Example protected route; extend with your user model as needed. */
router.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
