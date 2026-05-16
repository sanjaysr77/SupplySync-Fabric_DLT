'use strict';

const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    reserved: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    available: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    reorderLevel: {
      type: Number,
      default: 10,
      min: 0,
    },
    warehouseLocation: {
      type: String,
      default: 'Main Warehouse',
      trim: true,
    },
    lastRestocked: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Update available quantity before saving
inventorySchema.pre('save', function updateAvailable() {
  this.available = Math.max(0, this.quantity - this.reserved);
});

// Compound index for unique product-organization combination
inventorySchema.index({ product: 1, organization: 1 }, { unique: true });

module.exports = mongoose.model('Inventory', inventorySchema);
