'use strict';

const mongoose = require('mongoose');

const dppDataSchema = new mongoose.Schema(
  {
    productId: { type: String, required: true, trim: true },
    productName: { type: String, required: true, trim: true },
    manufacturerId: { type: String, default: '', trim: true },
    manufacturerName: { type: String, default: '', trim: true },
    certifications: [{ type: String, trim: true }],
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

module.exports = mongoose.model('DPPData', dppDataSchema);
