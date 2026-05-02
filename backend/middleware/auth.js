// middleware/auth.js
// JWT verification and role-based authorization middleware

const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');

/**
 * protect — verifies JWT from Authorization header or cookie
 * Attaches req.user for downstream route handlers
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;

  // 1. Check Authorization: Bearer <token>
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  // 2. Fallback: check httpOnly cookie
  else if (req.cookies?.token) {
    token = req.cookies.token;
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized — no token provided');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      res.status(401);
      throw new Error('User not found — token invalid');
    }

    if (!req.user.isActive) {
      res.status(403);
      throw new Error('Account has been deactivated. Contact support.');
    }

    next();
  } catch (err) {
    res.status(401);
    throw new Error('Not authorized — token verification failed');
  }
});

/**
 * authorize(...roles) — restricts route to specific roles
 * Usage: authorize('admin'), authorize('admin', 'seller')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      res.status(403);
      throw new Error(`Role '${req.user.role}' is not authorized to access this route`);
    }
    next();
  };
};

/**
 * optionalAuth — attaches user to req if token is present, but doesn't block if missing
 * Useful for routes like product detail where auth is optional
 */
const optionalAuth = asyncHandler(async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.token) {
    token = req.cookies.token;
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
    } catch {
      req.user = null;
    }
  }
  next();
});

module.exports = { protect, authorize, optionalAuth };
