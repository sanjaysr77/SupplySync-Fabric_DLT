'use strict';

const jwt = require('jsonwebtoken');

/**
 * Requires `Authorization: Bearer <token>`. Sets `req.user` to the decoded JWT payload.
 */
function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  const token = header.slice(7);
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    return next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

/**
 * Attaches `req.user` when a valid Bearer token is present; otherwise continues without `req.user`.
 */
function optionalAuthenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next();
  }
  const token = header.slice(7);
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    req.user = undefined;
  }
  return next();
}

module.exports = {
  authenticate,
  optionalAuthenticate,
};
