'use strict';

const { withChaincodeContract } = require('../utils/fabricContract');
const { parseFabricBuffer } = require('../utils/fabricPayload');

function resolveCreateArgs(body) {
  const {
    shipmentId,
    retailerPoId,
    distributorPoId,
    productId,
    quantity,
    promisedRetailerDeliveryDate,
    distributorDispatchDate,
    expectedRetailerDeliveryDate,
    poId,
    items,
  } = body;

  if (
    shipmentId &&
    retailerPoId &&
    distributorPoId &&
    productId &&
    quantity != null &&
    promisedRetailerDeliveryDate &&
    distributorDispatchDate &&
    expectedRetailerDeliveryDate
  ) {
    return [
      String(shipmentId),
      String(retailerPoId),
      String(distributorPoId),
      String(productId),
      String(quantity),
      String(promisedRetailerDeliveryDate),
      String(distributorDispatchDate),
      String(expectedRetailerDeliveryDate),
    ];
  }

  if (shipmentId && poId && distributorPoId && items && items.length > 0) {
    const line = items[0];
    const pid = line.productId || line.sku;
    const qty = line.quantity;
    if (!pid || qty == null) {
      return null;
    }
    if (!promisedRetailerDeliveryDate || !distributorDispatchDate || !expectedRetailerDeliveryDate) {
      return null;
    }
    return [
      String(shipmentId),
      String(poId),
      String(distributorPoId),
      String(pid),
      String(qty),
      String(promisedRetailerDeliveryDate),
      String(distributorDispatchDate),
      String(expectedRetailerDeliveryDate),
    ];
  }

  return null;
}

exports.createShipment = async (req, res) => {
  try {
    if (req.org !== 'distributor') {
      return res.status(403).json({
        success: false,
        message: 'Only distributor org users can create shipments on-chain',
      });
    }
    const args = resolveCreateArgs(req.body);
    if (!args) {
      return res.status(400).json({
        success: false,
        message:
          'Provide chaincode fields: shipmentId, retailerPoId, distributorPoId, productId, quantity, promisedRetailerDeliveryDate, distributorDispatchDate, expectedRetailerDeliveryDate (YYYY-MM-DD); or shipmentId, poId (retailer PO), distributorPoId, items[0].productId|sku, items[0].quantity, and the three dates',
      });
    }
    const buf = await withChaincodeContract('distributor', 'shipment', (contract) =>
      contract.submitTransaction('CreateShipment', ...args)
    );
    return res.status(201).json({ success: true, shipment: parseFabricBuffer(buf) });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message || 'Chaincode submit failed' });
  }
};

exports.updateShipmentStatus = async (req, res) => {
  try {
    if (req.org !== 'retailer') {
      return res.status(403).json({
        success: false,
        message: 'Only retailer org users can mark retailer delivery on-chain',
      });
    }
    const shipmentId = req.params.id;
    const { actualDeliveryDate, deliveryProof } = req.body;
    const date = actualDeliveryDate || req.body.actualRetailerDeliveryDate;
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(String(date))) {
      return res.status(400).json({
        success: false,
        message: 'actualDeliveryDate (YYYY-MM-DD) is required for MarkDeliveredByRetailer',
      });
    }
    const proof = deliveryProof != null ? String(deliveryProof) : '';
    const buf = await withChaincodeContract('retailer', 'shipment', (contract) =>
      contract.submitTransaction('MarkDeliveredByRetailer', String(shipmentId), String(date), proof)
    );
    return res.json({ success: true, shipment: parseFabricBuffer(buf) });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message || 'Chaincode submit failed' });
  }
};

exports.listShipments = async (req, res) => {
  try {
    const slug = req.org || 'distributor';
    const buf = await withChaincodeContract(slug, 'shipment', (contract) =>
      contract.evaluateTransaction('GetAllShipments')
    );
    let list = parseFabricBuffer(buf);
    if (!Array.isArray(list)) {
      list = [];
    }
    return res.json({ success: true, count: list.length, shipments: list });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message || 'Chaincode query failed' });
  }
};

exports.getShipmentById = async (req, res) => {
  try {
    const slug = req.org || 'distributor';
    const buf = await withChaincodeContract(slug, 'shipment', (contract) =>
      contract.evaluateTransaction('GetShipment', String(req.params.id))
    );
    return res.json({ success: true, shipment: parseFabricBuffer(buf) });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message || 'Chaincode query failed' });
  }
};

exports.trackShipment = async (req, res) => {
  try {
    const slug = req.org || 'distributor';
    const buf = await withChaincodeContract(slug, 'shipment', (contract) =>
      contract.evaluateTransaction('GetShipment', String(req.params.id))
    );
    const shipment = parseFabricBuffer(buf);
    const timeline = [];
    if (shipment && typeof shipment === 'object') {
      if (shipment.createdAtTxId) {
        timeline.push({ event: 'created', txId: shipment.createdAtTxId });
      }
      if (shipment.lastUpdatedTxId && shipment.lastUpdatedTxId !== shipment.createdAtTxId) {
        timeline.push({ event: 'updated', txId: shipment.lastUpdatedTxId });
      }
      if (shipment.status) {
        timeline.push({ event: 'status', value: shipment.status });
      }
    }
    return res.json({ success: true, shipment, timeline });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message || 'Chaincode query failed' });
  }
};
