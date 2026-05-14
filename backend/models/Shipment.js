'use strict';

const mongoose = require('mongoose');

const shipmentItemSchema = new mongoose.Schema(
  {
    sku: { type: String, trim: true },
    description: { type: String, trim: true },
    quantity: { type: Number, required: true, min: 0 },
  },
  { _id: true }
);

const shipmentSchema = new mongoose.Schema(
  {
    shipmentId: { type: String, required: true, unique: true, trim: true },
    poId: { type: mongoose.Schema.Types.ObjectId, ref: 'PurchaseOrder', required: true },
    shipper: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
    items: [shipmentItemSchema],
    status: {
      type: String,
      enum: ['pending', 'in-transit', 'delivered'],
      default: 'pending',
    },
    trackingNumber: { type: String, default: '', trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Shipment', shipmentSchema);
