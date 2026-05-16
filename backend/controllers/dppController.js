'use strict';

const { withChaincodeContract } = require('../utils/fabricContract');
const { parseFabricBuffer } = require('../utils/fabricPayload');
const DPPData = require('../models/DPPData');

exports.createDPP = async (req, res) => {
  try {
    const {
      batchId,
      productId,
      originCountry,
      manufactureDate,
      expiryDate,
      productName,
      manufacturerId,
      manufacturerName,
      certifications,
    } = req.body;

    if (!batchId || !productId || !originCountry || !manufactureDate || !expiryDate) {
      return res.status(400).json({
        success: false,
        message: 'batchId, productId, originCountry, manufactureDate, expiryDate are required',
      });
    }

    // Get product SKU if productId is MongoDB ObjectId
    let actualProductId = productId;
    if (productId && productId.length === 24 && /^[0-9a-f]{24}$/.test(productId)) {
      const Product = require('../models/Product');
      const product = await Product.findById(productId);
      if (product) {
        actualProductId = product.sku;
      }
    }

    // Create DPP record in MongoDB only
    const dppRecord = await DPPData.create({
      productId: String(actualProductId),
      productName: productName || '',
      manufacturerId: manufacturerId || '',
      manufacturerName: manufacturerName || '',
      certifications: certifications || [],
      metadata: {
        batchId: String(batchId),
        originCountry: String(originCountry),
        manufactureDate: String(manufactureDate),
        expiryDate: String(expiryDate),
        complianceStatus: 'PENDING',
      },
    });

    return res.status(201).json({ 
      success: true, 
      dpp: dppRecord,
      message: 'DPP created successfully'
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message || 'Failed to create DPP' });
  }
};

exports.getDPP = async (req, res) => {
  try {
    const dppId = req.params.id;

    const dpp = await DPPData.findById(dppId);
    if (!dpp) {
      return res.status(404).json({ success: false, message: 'DPP not found' });
    }

    return res.json({
      success: true,
      dpp,
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message || 'Failed to fetch DPP' });
  }
};

exports.listDPPs = async (req, res) => {
  try {
    const dpps = await DPPData.find().sort({ createdAt: -1 });
    return res.json({ success: true, count: dpps.length, dpps });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message || 'Failed to fetch DPPs' });
  }
};

exports.verifyDPP = async (req, res) => {
  try {
    const dppId = req.params.id;

    const dpp = await DPPData.findByIdAndUpdate(
      dppId,
      { 'metadata.complianceStatus': 'VERIFIED' },
      { new: true }
    );

    if (!dpp) {
      return res.status(404).json({ success: false, message: 'DPP not found' });
    }

    return res.json({
      success: true,
      verified: true,
      dpp,
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message || 'Verification failed' });
  }
};

exports.updateDPP = async (req, res) => {
  try {
    const dppId = req.params.id;
    const updates = req.body;

    const dpp = await DPPData.findByIdAndUpdate(dppId, updates, { new: true });

    if (!dpp) {
      return res.status(404).json({ success: false, message: 'DPP not found' });
    }

    return res.json({
      success: true,
      dpp,
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message || 'Failed to update DPP' });
  }
};
