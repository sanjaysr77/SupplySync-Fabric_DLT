'use strict';

const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Organization = require('../models/Organization');

const signToken = (userId) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured');
  }
  return jwt.sign({ id: userId.toString() }, secret, { expiresIn: '7d' });
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }
    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    if (user.status === 'inactive') {
      return res.status(403).json({ success: false, message: 'Account inactive' });
    }
    const ok = await user.comparePassword(password);
    if (!ok) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    const safe = await User.findById(user._id).populate('organization', 'name mspId domain status');
    const token = signToken(user._id);
    return res.json({ success: true, token, user: safe });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || 'Login failed' });
  }
};

exports.register = async (req, res) => {
  try {
    const { name, email, password, role, organization } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'name, email, and password are required' });
    }
    const exists = await User.findOne({ email: email.toLowerCase().trim() });
    if (exists) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }
    if (organization) {
      if (!mongoose.Types.ObjectId.isValid(organization)) {
        return res.status(400).json({ success: false, message: 'Invalid organization id' });
      }
      const org = await Organization.findById(organization);
      if (!org) {
        return res.status(400).json({ success: false, message: 'Organization not found' });
      }
    }
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'user',
      organization: organization || null,
      status: 'active',
    });
    const safe = await User.findById(user._id).populate('organization', 'name mspId domain status');
    return res.status(201).json({ success: true, user: safe });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }
    return res.status(400).json({ success: false, message: err.message || 'Registration failed' });
  }
};

exports.getMe = async (req, res) => {
  return res.json({ success: true, user: req.user });
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'currentPassword and newPassword are required' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'newPassword must be at least 8 characters' });
    }
    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const ok = await user.comparePassword(currentPassword);
    if (!ok) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }
    user.password = newPassword;
    await user.save();
    return res.json({ success: true, message: 'Password updated' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || 'Could not update password' });
  }
};

exports.completeRegistration = async (req, res) => {
  try {
    const { token, name, password, phone } = req.body;
    if (!token || !name || !password) {
      return res.status(400).json({ success: false, message: 'token, name, and password are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'password must be at least 8 characters' });
    }
    const user = await User.findOne({
      registrationToken: token,
      status: 'pending',
    });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired registration token' });
    }
    if (user.registrationTokenExpiry && user.registrationTokenExpiry < new Date()) {
      return res.status(400).json({ success: false, message: 'Registration token has expired' });
    }
    user.name = name;
    user.password = password;
    if (phone !== undefined) {
      user.phone = phone;
    }
    user.status = 'active';
    user.registrationToken = null;
    user.registrationTokenExpiry = null;
    await user.save();
    const safe = await User.findById(user._id).populate('organization', 'name mspId domain status');
    const jwtToken = signToken(user._id);
    return res.json({ success: true, token: jwtToken, user: safe });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || 'Registration completion failed' });
  }
};

exports.createUserAsAdmin = async (req, res) => {
  try {
    const { name, email, role, organization } = req.body;
    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'name and email are required' });
    }
    const exists = await User.findOne({ email: email.toLowerCase().trim() });
    if (exists) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }
    if (organization) {
      if (!mongoose.Types.ObjectId.isValid(organization)) {
        return res.status(400).json({ success: false, message: 'Invalid organization id' });
      }
      const org = await Organization.findById(organization);
      if (!org) {
        return res.status(400).json({ success: false, message: 'Organization not found' });
      }
    }
    const tempPassword = 'TempPassword123!';
    const user = new User({
      name,
      email: email.toLowerCase().trim(),
      password: tempPassword,
      role: role || 'user',
      organization: organization || null,
      status: 'active',
    });
    await user.save();
    const safe = await User.findById(user._id).populate('organization', 'name mspId domain status');
    return res.status(201).json({ success: true, user: safe, message: 'User created with temporary password: TempPassword123!' });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }
    return res.status(400).json({ success: false, message: err.message || 'User creation failed' });
  }
};
