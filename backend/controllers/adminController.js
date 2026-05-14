'use strict';

const mongoose = require('mongoose');
const Organization = require('../models/Organization');
const Role = require('../models/Role');
const User = require('../models/User');
const Product = require('../models/Product');
const PurchaseOrder = require('../models/PurchaseOrder');
const Shipment = require('../models/Shipment');
const DPPData = require('../models/DPPData');

exports.createOrganization = async (req, res) => {
  try {
    const { name, mspId, domain } = req.body;
    if (!name || !mspId || !domain) {
      return res.status(400).json({ success: false, message: 'name, mspId, and domain are required' });
    }
    const org = await Organization.create({ name, mspId, domain, status: 'active' });
    return res.status(201).json({ success: true, organization: org });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: 'Organization mspId or domain already exists' });
    }
    return res.status(400).json({ success: false, message: err.message || 'Could not create organization' });
  }
};

exports.listOrganizations = async (req, res) => {
  try {
    const organizations = await Organization.find().sort({ name: 1 });
    return res.json({ success: true, count: organizations.length, organizations });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || 'Could not list organizations' });
  }
};

exports.createRole = async (req, res) => {
  try {
    const { name, permissions, organization } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'name is required' });
    }
    const allowedNames = ['admin', 'user', 'approver'];
    if (!allowedNames.includes(name)) {
      return res.status(400).json({ success: false, message: `name must be one of: ${allowedNames.join(', ')}` });
    }
    let orgId = null;
    if (organization) {
      if (!mongoose.Types.ObjectId.isValid(organization)) {
        return res.status(400).json({ success: false, message: 'Invalid organization id' });
      }
      const org = await Organization.findById(organization);
      if (!org) {
        return res.status(400).json({ success: false, message: 'Organization not found' });
      }
      orgId = organization;
    }
    const role = await Role.create({
      name,
      permissions: Array.isArray(permissions) ? permissions : [],
      organization: orgId,
    });
    return res.status(201).json({ success: true, role });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message || 'Could not create role' });
  }
};

exports.assignRole = async (req, res) => {
  try {
    const { userId, roleId } = req.body;
    if (!userId || !roleId) {
      return res.status(400).json({ success: false, message: 'userId and roleId are required' });
    }
    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(roleId)) {
      return res.status(400).json({ success: false, message: 'Invalid userId or roleId' });
    }
    const role = await Role.findById(roleId);
    if (!role) {
      return res.status(404).json({ success: false, message: 'Role not found' });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (role.organization && user.organization && role.organization.toString() !== user.organization.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Role organization does not match user organization',
      });
    }
    user.role = role.name;
    await user.save();
    const fresh = await User.findById(user._id).select('-password').populate('organization', 'name mspId domain status');
    return res.json({ success: true, user: fresh, role });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || 'Could not assign role' });
  }
};

exports.getSystemStats = async (req, res) => {
  try {
    const [
      users,
      organizations,
      roles,
      products,
      purchaseOrders,
      shipments,
      dppRecords,
    ] = await Promise.all([
      User.countDocuments(),
      Organization.countDocuments(),
      Role.countDocuments(),
      Product.countDocuments(),
      PurchaseOrder.countDocuments(),
      Shipment.countDocuments(),
      DPPData.countDocuments(),
    ]);
    return res.json({
      success: true,
      stats: {
        users,
        organizations,
        roles,
        products,
        purchaseOrders,
        shipments,
        dppRecords,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || 'Could not load stats' });
  }
};
