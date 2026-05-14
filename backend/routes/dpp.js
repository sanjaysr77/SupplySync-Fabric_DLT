'use strict';

const { Router } = require('express');
const { createDPP, getDPP, updateDPP, listDPPs, verifyDPP } = require('../controllers/dppController');
const { protect, requireBlockchainAccess } = require('../middleware/auth');

const router = Router();

router.post('/create', protect, requireBlockchainAccess, createDPP);
router.get('/list/:manufacturerId', protect, requireBlockchainAccess, listDPPs);
router.get('/:id/verify', protect, requireBlockchainAccess, verifyDPP);
router.put('/:id', protect, requireBlockchainAccess, updateDPP);
router.get('/:id', protect, requireBlockchainAccess, getDPP);

module.exports = router;
