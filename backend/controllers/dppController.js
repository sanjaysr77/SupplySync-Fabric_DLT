'use strict';

const { withChaincodeContract } = require('../utils/fabricContract');
const { parseFabricBuffer } = require('../utils/fabricPayload');

exports.createDPP = async (req, res) => {
  try {
    if (req.org !== 'producer') {
      return res.status(403).json({
        success: false,
        message: 'Only producer org users can create DPP records on-chain',
      });
    }
    const {
      dppId,
      batchId,
      productId,
      originCountry,
      manufactureDate,
      expiryDate,
      certificationRef,
      complianceStandard,
      metadata,
      productName,
      manufacturerId,
      certifications,
    } = req.body;

    const id =
      dppId ||
      (productId && batchId ? `${String(productId)}-${String(batchId)}` : null);
    if (!id || !batchId || !productId || !originCountry || !manufactureDate || !expiryDate) {
      return res.status(400).json({
        success: false,
        message:
          'batchId, productId, originCountry, manufactureDate, expiryDate (YYYY-MM-DD) are required; provide dppId or unique productId+batchId pair',
      });
    }
    const certRef =
      certificationRef ||
      (Array.isArray(certifications) ? certifications.filter(Boolean).join(', ') : '') ||
      'UNKNOWN';
    const standard =
      complianceStandard && String(complianceStandard).toUpperCase().includes('EU')
        ? String(complianceStandard)
        : 'EU-DPP-DEFAULT';
    const metaObj = {
      ...(metadata && typeof metadata === 'object' ? metadata : {}),
    };
    if (productName) {
      metaObj.productName = productName;
    }
    if (manufacturerId) {
      metaObj.manufacturerId = manufacturerId;
    }
    const metadataJson = Object.keys(metaObj).length ? JSON.stringify(metaObj) : '';
    const buf = await withChaincodeContract('producer', 'dppcontract', (contract) =>
      contract.submitTransaction(
        'CreateDPP',
        String(id),
        String(batchId),
        String(productId),
        String(originCountry).toUpperCase(),
        String(manufactureDate),
        String(expiryDate),
        String(certRef),
        String(standard),
        metadataJson
      )
    );
    return res.status(201).json({ success: true, dpp: parseFabricBuffer(buf) });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message || 'Chaincode submit failed' });
  }
};

exports.getDPP = async (req, res) => {
  try {
    const dppId = req.params.id;
    const slug = req.org || 'producer';
    const buf = await withChaincodeContract(slug, 'dppcontract', (contract) =>
      contract.evaluateTransaction('GetDPP', String(dppId))
    );
    return res.json({
      success: true,
      dppId,
      note: 'Ledger key is dppId (not Mongo product _id)',
      dpp: parseFabricBuffer(buf),
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message || 'Chaincode query failed' });
  }
};

exports.updateDPP = async (req, res) => {
  try {
    const dppId = req.params.id;
    const { transferTo, toOrgMSP, validateEu } = req.body || {};
    const target = transferTo || toOrgMSP;

    if (validateEu) {
      const slug = req.org || 'producer';
      const buf = await withChaincodeContract(slug, 'dppcontract', (contract) =>
        contract.submitTransaction('ValidateForEU', String(dppId))
      );
      return res.json({ success: true, dpp: parseFabricBuffer(buf) });
    }

    if (!target) {
      return res.status(400).json({
        success: false,
        message: 'Provide transferTo (or toOrgMSP) as DistributorMSP|RetailerMSP, or validateEu: true',
      });
    }
    const slug = req.org || 'producer';
    const buf = await withChaincodeContract(slug, 'dppcontract', (contract) =>
      contract.submitTransaction('TransferDPP', String(dppId), String(target))
    );
    return res.json({ success: true, dpp: parseFabricBuffer(buf) });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message || 'Chaincode submit failed' });
  }
};

exports.listDPPs = async (req, res) => {
  try {
    const slug = req.org || 'producer';
    const buf = await withChaincodeContract(slug, 'dppcontract', (contract) =>
      contract.evaluateTransaction('GetAllDPP')
    );
    let list = parseFabricBuffer(buf);
    if (!Array.isArray(list)) {
      list = [];
    }
    const { manufacturerId } = req.params;
    if (manufacturerId && manufacturerId !== 'all') {
      list = list.filter(
        (row) =>
          row &&
          (String(row.productId) === String(manufacturerId) ||
            String(row.producerOrg || '').includes(manufacturerId) ||
            (row.metadataJson && String(row.metadataJson).includes(manufacturerId)))
      );
    }
    return res.json({ success: true, count: list.length, dpps: list });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message || 'Chaincode query failed' });
  }
};

exports.verifyDPP = async (req, res) => {
  try {
    const dppId = req.params.id;
    const slug = req.org || 'producer';
    const buf = await withChaincodeContract(slug, 'dppcontract', (contract) =>
      contract.submitTransaction('ValidateForEU', String(dppId))
    );
    return res.json({
      success: true,
      verified: true,
      dpp: parseFabricBuffer(buf),
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message || 'Verification failed' });
  }
};
