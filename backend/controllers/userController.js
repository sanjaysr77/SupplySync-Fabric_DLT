'use strict';

const mongoose = require('mongoose');
const User = require('../models/User');

exports.getProfile = async (req, res) => {
  return res.json({ success: true, user: req.user });
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, email } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (name !== undefined) {
      user.name = name;
    }
    if (phone !== undefined) {
      user.phone = phone;
    }
    if (email !== undefined && email.toLowerCase().trim() !== user.email) {
      const taken = await User.findOne({ email: email.toLowerCase().trim(), _id: { $ne: user._id } });
      if (taken) {
        return res.status(409).json({ success: false, message: 'Email already in use' });
      }
      user.email = email.toLowerCase().trim();
    }
    await user.save();
    const fresh = await User.findById(user._id).populate('organization', 'name mspId domain status');
    return res.json({ success: true, user: fresh });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message || 'Update failed' });
  }
};

exports.listUsers = async (req, res) => {
  try {
    const query = {};
    
    // Admin users can see all users or filter by organization
    if (req.user.role === 'admin') {
      const orgFilter = req.query.organization;
      if (orgFilter) {
        if (!mongoose.Types.ObjectId.isValid(orgFilter)) {
          return res.status(400).json({ success: false, message: 'Invalid organization filter' });
        }
        query.organization = orgFilter;
      }
    } else {
      // Non-admin users can only see users from their organization
      if (req.user.organization) {
        query.organization = req.user.organization;
      }
    }
    
    const users = await User.find(query).select('-password').populate('organization', 'name mspId domain');
    return res.json({ success: true, count: users.length, users });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || 'Could not list users' });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid user id' });
    }
    const isSelf = id === req.user._id.toString();
    if (!isSelf && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const user = await User.findById(id).select('-password').populate('organization', 'name mspId domain status');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    return res.json({ success: true, user });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || 'Could not load user' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid user id' });
    }
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    user.status = 'inactive';
    await user.save();
    return res.json({ success: true, message: 'User deactivated' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || 'Could not delete user' });
  }
};

exports.assignOrganization = async (req, res) => {
  try {
    const { userId, organizationId } = req.body;
    if (!userId || !organizationId) {
      return res.status(400).json({ success: false, message: 'userId and organizationId are required' });
    }
    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(organizationId)) {
      return res.status(400).json({ success: false, message: 'Invalid userId or organizationId' });
    }
    const Organization = require('../models/Organization');
    const org = await Organization.findById(organizationId);
    if (!org) {
      return res.status(404).json({ success: false, message: 'Organization not found' });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    user.organization = organizationId;
    await user.save();
    const fresh = await User.findById(user._id).select('-password').populate('organization', 'name mspId domain status');
    return res.json({ success: true, user: fresh });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || 'Could not assign organization' });
  }
};
