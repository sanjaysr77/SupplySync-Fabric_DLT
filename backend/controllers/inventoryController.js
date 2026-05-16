'use strict';

const mongoose = require('mongoose');
const Inventory = require('../models/Inventory');
const InventoryTransaction = require('../models/InventoryTransaction');
const Product = require('../models/Product');

exports.getInventory = async (req, res) => {
  try {
    const { organizationId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(organizationId)) {
      return res.status(400).json({ success: false, message: 'Invalid organization id' });
    }

    const inventory = await Inventory.find({ organization: organizationId })
      .populate('product', 'sku name price category')
      .sort({ createdAt: -1 });

    const summary = {
      totalItems: inventory.length,
      totalQuantity: inventory.reduce((sum, inv) => sum + inv.quantity, 0),
      totalReserved: inventory.reduce((sum, inv) => sum + inv.reserved, 0),
      totalAvailable: inventory.reduce((sum, inv) => sum + inv.available, 0),
      lowStockItems: inventory.filter((inv) => inv.available <= inv.reorderLevel).length,
    };

    return res.json({ success: true, inventory, summary });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || 'Could not fetch inventory' });
  }
};

exports.getInventoryByProduct = async (req, res) => {
  try {
    const { productId, organizationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId) || !mongoose.Types.ObjectId.isValid(organizationId)) {
      return res.status(400).json({ success: false, message: 'Invalid product or organization id' });
    }

    const inventory = await Inventory.findOne({
      product: productId,
      organization: organizationId,
    }).populate('product', 'sku name price category');

    if (!inventory) {
      return res.status(404).json({ success: false, message: 'Inventory not found' });
    }

    return res.json({ success: true, inventory });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || 'Could not fetch inventory' });
  }
};

exports.addStock = async (req, res) => {
  try {
    const { productId, organizationId, quantity, warehouseLocation, notes } = req.body;

    if (!productId || !organizationId || quantity == null || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'productId, organizationId, and quantity (>0) are required',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(productId) || !mongoose.Types.ObjectId.isValid(organizationId)) {
      return res.status(400).json({ success: false, message: 'Invalid product or organization id' });
    }

    let inventory = await Inventory.findOne({
      product: productId,
      organization: organizationId,
    });

    if (!inventory) {
      inventory = await Inventory.create({
        product: productId,
        organization: organizationId,
        quantity: Number(quantity),
        warehouseLocation: warehouseLocation || 'Main Warehouse',
        lastRestocked: new Date(),
      });
    } else {
      inventory.quantity += Number(quantity);
      inventory.lastRestocked = new Date();
      await inventory.save();
    }

    // Log transaction
    await InventoryTransaction.create({
      product: productId,
      organization: organizationId,
      type: 'inbound',
      quantity: Number(quantity),
      notes: notes || 'Stock added',
      createdBy: req.user._id,
    });

    return res.status(201).json({ success: true, inventory });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message || 'Could not add stock' });
  }
};

exports.reserveStock = async (req, res) => {
  try {
    const { productId, organizationId, quantity, reference, notes } = req.body;

    if (!productId || !organizationId || quantity == null || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'productId, organizationId, and quantity (>0) are required',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(productId) || !mongoose.Types.ObjectId.isValid(organizationId)) {
      return res.status(400).json({ success: false, message: 'Invalid product or organization id' });
    }

    let inventory = await Inventory.findOne({
      product: productId,
      organization: organizationId,
    });

    if (!inventory) {
      return res.status(404).json({ success: false, message: 'Inventory not found' });
    }

    if (inventory.available < quantity) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock. Available: ${inventory.available}, Requested: ${quantity}`,
      });
    }

    inventory.reserved += Number(quantity);
    await inventory.save();

    // Log transaction
    await InventoryTransaction.create({
      product: productId,
      organization: organizationId,
      type: 'reservation',
      quantity: Number(quantity),
      reference: reference || null,
      referenceType: 'PO',
      notes: notes || 'Stock reserved',
      createdBy: req.user._id,
    });

    return res.json({ success: true, inventory });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message || 'Could not reserve stock' });
  }
};

exports.releaseStock = async (req, res) => {
  try {
    const { productId, organizationId, quantity, reference, notes } = req.body;

    if (!productId || !organizationId || quantity == null || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'productId, organizationId, and quantity (>0) are required',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(productId) || !mongoose.Types.ObjectId.isValid(organizationId)) {
      return res.status(400).json({ success: false, message: 'Invalid product or organization id' });
    }

    const inventory = await Inventory.findOne({
      product: productId,
      organization: organizationId,
    });

    if (!inventory) {
      return res.status(404).json({ success: false, message: 'Inventory not found' });
    }

    if (inventory.reserved < quantity) {
      return res.status(400).json({
        success: false,
        message: `Cannot release more than reserved. Reserved: ${inventory.reserved}, Requested: ${quantity}`,
      });
    }

    inventory.reserved -= Number(quantity);
    await inventory.save();

    // Log transaction
    await InventoryTransaction.create({
      product: productId,
      organization: organizationId,
      type: 'release',
      quantity: Number(quantity),
      reference: reference || null,
      referenceType: 'PO',
      notes: notes || 'Stock released',
      createdBy: req.user._id,
    });

    return res.json({ success: true, inventory });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message || 'Could not release stock' });
  }
};

exports.adjustStock = async (req, res) => {
  try {
    const { productId, organizationId, quantity, notes } = req.body;

    if (!productId || !organizationId || quantity == null) {
      return res.status(400).json({
        success: false,
        message: 'productId, organizationId, and quantity are required',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(productId) || !mongoose.Types.ObjectId.isValid(organizationId)) {
      return res.status(400).json({ success: false, message: 'Invalid product or organization id' });
    }

    let inventory = await Inventory.findOne({
      product: productId,
      organization: organizationId,
    });

    if (!inventory) {
      return res.status(404).json({ success: false, message: 'Inventory not found' });
    }

    const oldQuantity = inventory.quantity;
    inventory.quantity = Math.max(0, inventory.quantity + Number(quantity));
    await inventory.save();

    // Log transaction
    await InventoryTransaction.create({
      product: productId,
      organization: organizationId,
      type: 'adjustment',
      quantity: Number(quantity),
      notes: notes || `Adjusted from ${oldQuantity} to ${inventory.quantity}`,
      createdBy: req.user._id,
    });

    return res.json({ success: true, inventory });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message || 'Could not adjust stock' });
  }
};

exports.getTransactions = async (req, res) => {
  try {
    const { organizationId } = req.params;
    const { productId, type, limit = 50, skip = 0 } = req.query;

    if (!mongoose.Types.ObjectId.isValid(organizationId)) {
      return res.status(400).json({ success: false, message: 'Invalid organization id' });
    }

    const filter = { organization: organizationId };
    if (productId && mongoose.Types.ObjectId.isValid(productId)) {
      filter.product = productId;
    }
    if (type) {
      filter.type = type;
    }

    const transactions = await InventoryTransaction.find(filter)
      .populate('product', 'sku name')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip(Number(skip));

    const total = await InventoryTransaction.countDocuments(filter);

    return res.json({ success: true, transactions, total, limit: Number(limit), skip: Number(skip) });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || 'Could not fetch transactions' });
  }
};

exports.setReorderLevel = async (req, res) => {
  try {
    const { productId, organizationId, reorderLevel } = req.body;

    if (!productId || !organizationId || reorderLevel == null) {
      return res.status(400).json({
        success: false,
        message: 'productId, organizationId, and reorderLevel are required',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(productId) || !mongoose.Types.ObjectId.isValid(organizationId)) {
      return res.status(400).json({ success: false, message: 'Invalid product or organization id' });
    }

    const inventory = await Inventory.findOne({
      product: productId,
      organization: organizationId,
    });

    if (!inventory) {
      return res.status(404).json({ success: false, message: 'Inventory not found' });
    }

    inventory.reorderLevel = Number(reorderLevel);
    await inventory.save();

    return res.json({ success: true, inventory });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message || 'Could not set reorder level' });
  }
};
