'use strict';

const { Router } = require('express');

const router = Router();

router.get('/', (req, res) => {
  res.json({ success: true, status: 'ok', service: 'hyperledger-fabric-trial-backend' });
});

module.exports = router;
