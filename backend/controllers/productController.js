'use strict';

const mongoose = require('mongoose');
const Product = require('../models/Product');

exports.createProduct = async (req, res) => {
  try {
    const { sku, name, description, price, category, manufacturer } = req.body;
    if (!sku || !name || price == null) {
      return res.status(400).json({ success: false, message: 'sku, name, and price are required' });
    }
    const product = await Product.create({
      sku: String(sku).trim(),
      name,
      description: description || '',
      price: Number(price),
      category: category || '',
      manufacturer: manufacturer || '',
    });
    return res.status(201).json({ success: true, product });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: 'SKU already exists' });
    }
    return res.status(400).json({ success: false, message: err.message || 'Could not create product' });
  }
};

exports.listProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ sku: 1 });
    return res.json({ success: true, count: products.length, products });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || 'Could not list products' });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid product id' });
    }
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    return res.json({ success: true, product });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || 'Could not load product' });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid product id' });
    }
    const allowed = ['name', 'description', 'price', 'category', 'manufacturer', 'sku'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }
    if (updates.price !== undefined) {
      updates.price = Number(updates.price);
    }
    const product = await Product.findByIdAndUpdate(id, { $set: updates }, { new: true, runValidators: true });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    return res.json({ success: true, product });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: 'SKU already exists' });
    }
    return res.status(400).json({ success: false, message: err.message || 'Could not update product' });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid product id' });
    }
    const product = await Product.findByIdAndDelete(id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    return res.json({ success: true, message: 'Product deleted' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || 'Could not delete product' });
  }
};
