'use strict';

const mongoose = require('mongoose');

const poItemSchema = new mongoose.Schema(
  {
    sku: { type: String, trim: true },
    description: { type: String, trim: true },
    quantity: { type: Number, required: true, min: 0 },
    unitPrice: { type: Number, default: 0, min: 0 },
  },
  { _id: true }
);

const purchaseOrderSchema = new mongoose.Schema(
  {
    poId: { type: String, required: true, unique: true, trim: true },
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
    items: [poItemSchema],
    totalAmount: { type: Number, required: true, min: 0, default: 0 },
    status: {
      type: String,
      enum: ['draft', 'submitted', 'approved', 'rejected', 'completed'],
      default: 'draft',
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PurchaseOrder', purchaseOrderSchema);
