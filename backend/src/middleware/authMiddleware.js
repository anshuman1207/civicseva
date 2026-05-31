const jwt = require('jsonwebtoken');
const User = require('../models/User');
const BlacklistedToken = require('../models/BlacklistedToken');
const asyncHandler = require('./asyncHandler');

const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.cookies.token || (req.headers.authorization && req.headers.authorization.startsWith('Bearer'))) {
    try {
      token = req.cookies.token || req.headers.authorization.split(' ')[1];

      // Check if token is blacklisted
      const isBlacklisted = await BlacklistedToken.findOne({ token });
      if (isBlacklisted) {
        return res.status(401).json({ message: 'Session invalidated, please login again', code: 'TOKEN_INVALID' });
      }

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token
      req.user = await User.findById(decoded.id).select('-password');
      
      if (!req.user) {
        return res.status(401).json({ message: 'User not found' });
      }

      // Attach token to request for logout blacklisting
      req.token = token;

      next();
    } catch (error) {
      console.error('JWT Verification Error:', error.message);
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Session expired, please login again', code: 'TOKEN_EXPIRED' });
      }
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
});

/**
 * Standardized Role-based access control
 * @param  {...string} roles - Authorized roles (e.g., 'admin', 'authority', 'user')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `User role '${req.user.role}' is not authorized to access this route` 
      });
    }
    next();
  };
};

// Legacy admin middleware (keeping for compatibility, but deprecated)
const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as an admin' });
  }
};

const optionalAuth = async (req, res, next) => {
  if (req.cookies.token || (req.headers.authorization && req.headers.authorization.startsWith('Bearer'))) {
    try {
      const token = req.cookies.token || req.headers.authorization.split(' ')[1];
      
      // Check blacklist even for optional auth
      const isBlacklisted = await BlacklistedToken.findOne({ token });
      if (!isBlacklisted) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id).select('-password');
      }
    } catch (error) {
      // Ignore error for optional auth
    }
  }
  next();
};

module.exports = { protect, admin, authorize, optionalAuth };

