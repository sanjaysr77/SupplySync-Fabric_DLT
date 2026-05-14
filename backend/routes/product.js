'use strict';

const { Router } = require('express');
const {
  createProduct,
  listProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');
const { protect, requireRole } = require('../middleware/auth');

const router = Router();

router.post('/create', protect, requireRole('admin'), createProduct);
router.get('/list', protect, listProducts);
router.get('/:id', protect, getProductById);
router.put('/:id', protect, requireRole('admin'), updateProduct);
router.delete('/:id', protect, requireRole('admin'), deleteProduct);

module.exports = router;
