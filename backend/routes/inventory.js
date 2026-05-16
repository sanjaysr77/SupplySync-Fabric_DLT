'use strict';

const express = require('express');
const { protect, requireBlockchainAccess } = require('../middleware/auth');
const inventoryController = require('../controllers/inventoryController');

const router = express.Router();

// All inventory routes require authentication and blockchain access
router.use(protect, requireBlockchainAccess);

// Get inventory for organization
router.get('/org/:organizationId', inventoryController.getInventory);

// Get inventory for specific product
router.get('/product/:productId/org/:organizationId', inventoryController.getInventoryByProduct);

// Add stock
router.post('/add', inventoryController.addStock);

// Reserve stock
router.post('/reserve', inventoryController.reserveStock);

// Release reserved stock
router.post('/release', inventoryController.releaseStock);

// Adjust stock
router.post('/adjust', inventoryController.adjustStock);

// Set reorder level
router.post('/reorder-level', inventoryController.setReorderLevel);

// Get transactions
router.get('/transactions/:organizationId', inventoryController.getTransactions);

module.exports = router;
