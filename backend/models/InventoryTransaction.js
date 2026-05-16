'use strict';

const mongoose = require('mongoose');

const inventoryTransactionSchema = new mongoose.Schema(
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
    type: {
      type: String,
      enum: ['inbound', 'outbound', 'adjustment', 'reservation', 'release'],
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    reference: {
      type: String,
      default: null,
      trim: true,
    },
    referenceType: {
      type: String,
      enum: ['PO', 'Shipment', 'Manual', null],
      default: null,
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('InventoryTransaction', inventoryTransactionSchema);
