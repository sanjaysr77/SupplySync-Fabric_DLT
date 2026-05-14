'use strict';

const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    sku: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    price: { type: Number, required: true, min: 0 },
    category: { type: String, default: '', trim: true },
    manufacturer: { type: String, default: '', trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);
