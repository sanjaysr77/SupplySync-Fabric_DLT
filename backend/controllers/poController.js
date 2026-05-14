'use strict';

const { withPurchaseOrderContract } = require('../utils/fabricContract');
const { parseFabricBuffer } = require('../utils/fabricPayload');

exports.createPO = async (req, res) => {
  try {
    const org = req.org;
    const {
      poId,
      productId,
      quantity,
      requestedDeliveryDate,
      linkedRetailerPOId,
      notes,
    } = req.body;

    if (!poId || !productId || !quantity || !requestedDeliveryDate) {
      return res.status(400).json({
        success: false,
        message: 'poId, productId, quantity, and requestedDeliveryDate (YYYY-MM-DD) are required',
      });
    }

    if (org === 'retailer') {
      const buf = await withPurchaseOrderContract('retailer', (contract) =>
        contract.submitTransaction(
          'CreateRetailerPO',
          String(poId),
          String(productId),
          String(quantity),
          String(requestedDeliveryDate),
          notes != null ? String(notes) : ''
        )
      );
      return res.status(201).json({ success: true, purchaseOrder: parseFabricBuffer(buf) });
    }

    if (org === 'distributor') {
      if (!linkedRetailerPOId) {
        return res.status(400).json({
          success: false,
          message: 'linkedRetailerPOId is required for distributor POs',
        });
      }
      const buf = await withPurchaseOrderContract('distributor', (contract) =>
        contract.submitTransaction(
          'CreateDistributorPO',
          String(poId),
          String(productId),
          String(quantity),
          String(requestedDeliveryDate),
          String(linkedRetailerPOId),
          notes != null ? String(notes) : ''
        )
      );
      return res.status(201).json({ success: true, purchaseOrder: parseFabricBuffer(buf) });
    }

    return res.status(403).json({
      success: false,
      message: 'Producer org cannot create POs via this endpoint (use retailer or distributor context)',
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message || 'Chaincode submit failed',
    });
  }
};

exports.approvePO = async (req, res) => {
  try {
    if (req.org !== 'producer') {
      return res.status(403).json({
        success: false,
        message: 'Only producer org users can approve distributor POs on-chain',
      });
    }
    const poId = req.params.id;
    const note = req.body && req.body.note != null ? String(req.body.note) : '';
    const buf = await withPurchaseOrderContract('producer', (contract) =>
      contract.submitTransaction('RespondToDistributorPO', String(poId), 'ACCEPT', note)
    );
    return res.json({ success: true, purchaseOrder: parseFabricBuffer(buf) });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message || 'Chaincode submit failed',
    });
  }
};

exports.rejectPO = async (req, res) => {
  try {
    if (req.org !== 'producer') {
      return res.status(403).json({
        success: false,
        message: 'Only producer org users can reject distributor POs on-chain',
      });
    }
    const poId = req.params.id;
    const reason = req.body && req.body.reason != null ? String(req.body.reason) : '';
    const buf = await withPurchaseOrderContract('producer', (contract) =>
      contract.submitTransaction('RespondToDistributorPO', String(poId), 'REJECT', reason)
    );
    return res.json({ success: true, purchaseOrder: parseFabricBuffer(buf) });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message || 'Chaincode submit failed',
    });
  }
};

exports.listPOs = async (req, res) => {
  try {
    const slug = req.org || 'retailer';
    const buf = await withPurchaseOrderContract(slug, (contract) => contract.evaluateTransaction('GetAllPOs'));
    return res.json({ success: true, purchaseOrders: parseFabricBuffer(buf) });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message || 'Chaincode query failed',
    });
  }
};

exports.getPOById = async (req, res) => {
  try {
    const poId = req.params.id;
    const slug = req.org || 'retailer';
    const buf = await withPurchaseOrderContract(slug, (contract) =>
      contract.evaluateTransaction('GetPO', String(poId))
    );
    return res.json({ success: true, purchaseOrder: parseFabricBuffer(buf) });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message || 'Chaincode query failed',
    });
  }
};

exports.updatePOStatus = async (req, res) => {
  try {
    if (req.org !== 'distributor') {
      return res.status(403).json({
        success: false,
        message: 'Only distributor org users can mark dispatch on retailer POs',
      });
    }
    const poId = req.params.id;
    const { dispatchDate } = req.body;
    if (!dispatchDate || !/^\d{4}-\d{2}-\d{2}$/.test(String(dispatchDate))) {
      return res.status(400).json({
        success: false,
        message: 'dispatchDate (YYYY-MM-DD) is required for MarkDistributorDispatch',
      });
    }
    const buf = await withPurchaseOrderContract('distributor', (contract) =>
      contract.submitTransaction('MarkDistributorDispatch', String(poId), String(dispatchDate))
    );
    return res.json({ success: true, purchaseOrder: parseFabricBuffer(buf) });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message || 'Chaincode submit failed',
    });
  }
};
