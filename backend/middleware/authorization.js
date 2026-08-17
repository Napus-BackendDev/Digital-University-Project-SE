'use strict';

const jwt = require('jsonwebtoken');
const User = require('../server/Project/User/models/user.model');

function getRoleTitle(role) {
  if (!role) return '';
  if (typeof role.title === 'string') return role.title.toLowerCase();
  const english = Array.isArray(role.title)
    ? role.title.find(item => item && String(item.key).toLowerCase() === 'en')
    : null;
  return String(english?.value || role.title?.[0]?.value || '').toLowerCase();
}

async function authenticate(req, res, next) {
  try {
    const remoteAddress = String(req.socket?.remoteAddress || '');
    const isLocalRequest = remoteAddress === '127.0.0.1' || remoteAddress === '::1' || remoteAddress === '::ffff:127.0.0.1';
    if (process.env.AUTH_BYPASS === 'true' && isLocalRequest) {
      const bypassEmail = String(process.env.BYPASS_USER_EMAIL || '').trim().toLowerCase();
      const bypassUser = bypassEmail
        ? await User.findOne({ email: bypassEmail }).populate('role').lean()
        : null;
      if (!bypassUser) return res.status(503).json({ message: 'Local login bypass user is not configured' });
      req.authUser = bypassUser;
      return next();
    }
    const token = req.cookies?.token;
    if (!token || !process.env.JWT_SECRET) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).populate('role').lean();
    if (!user) return res.status(401).json({ message: 'User no longer exists' });
    req.authUser = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired session' });
  }
}

function authorize(page, action = 'read') {
  return function permissionMiddleware(req, res, next) {
    const role = req.authUser?.role;
    if (getRoleTitle(role) === 'admin') return next();
    const permission = Array.isArray(role?.permission)
      ? role.permission.find(item => String(item.page) === String(page))
      : null;
    const access = Array.isArray(permission?.access)
      ? permission.access.find(item => String(item.key).toLowerCase() === action)
      : null;
    if (!access?.value) {
      return res.status(403).json({ message: `Permission denied: ${action} ${page}` });
    }
    next();
  };
}

module.exports = { authenticate, authorize, getRoleTitle };
