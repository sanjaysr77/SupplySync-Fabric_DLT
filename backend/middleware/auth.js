'use strict';

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Organization = require('../models/Organization');

/**
 * Verify JWT, load user from DB, attach `req.user` (password excluded).
 * Rejects inactive accounts. Expects JWT payload `{ id: userId }`.
 */
const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return res.status(500).json({ success: false, message: 'Server configuration error' });
  }
  try {
    const decoded = jwt.verify(token, secret);
    req.user = await User.findById(decoded.id).select('-password').populate('organization', 'name mspId domain status');
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }
    if (req.user.status === 'inactive') {
      return res.status(403).json({ success: false, message: 'Account inactive' });
    }
    return next();
  } catch {
    return res.status(401).json({ success: false, message: 'Token invalid or expired' });
  }
};

const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: `Access denied. Required role(s): ${roles.join(', ')}`,
    });
  }
  return next();
};

/**
 * Sets `req.org` to a Fabric org slug (`retailer` | `distributor` | `producer`) from the user's organization domain,
 * or `retailer` when missing (matches network peer org slugs in config/fabric.js).
 */
const requireBlockchainAccess = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }
  try {
    let domain;
    if (req.user.organization && typeof req.user.organization === 'object' && req.user.organization.domain) {
      domain = req.user.organization.domain;
    } else if (req.user.organization) {
      const org = await Organization.findById(req.user.organization).select('domain').lean();
      domain = org && org.domain;
    }
    if (!domain) {
      req.org = 'retailer';
      return next();
    }
    const base = String(domain).toLowerCase().replace(/\.example\.com$/i, '');
    const slug = base.split('.')[0];
    const allowed = ['retailer', 'distributor', 'producer'];
    req.org = allowed.includes(slug) ? slug : 'retailer';
    return next();
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  protect,
  requireRole,
  requireBlockchainAccess,
};
