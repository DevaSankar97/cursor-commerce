const jwt = require('jsonwebtoken');
const { asyncHandler } = require('./errorMiddleware');
const ErrorResponse = require('../utils/errorResponse');
const User = require('../models/User');

// Protect routes - require authentication
const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Check for token in header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  // Check for token in cookies
  else if (req.cookies.token) {
    token = req.cookies.token;
  }

  // Make sure token exists
  if (!token) {
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from token
    const user = await User.findById(decoded.id)
      .select('+password +loginAttempts +lockUntil')
      .populate('addresses');

    if (!user) {
      return next(new ErrorResponse('No user found with this token', 401));
    }

    // Check if user account is active
    if (user.accountStatus !== 'active') {
      return next(new ErrorResponse('Account is inactive. Please contact support.', 401));
    }

    // Check if account is locked
    if (user.isLocked) {
      return next(new ErrorResponse('Account is temporarily locked due to too many failed login attempts', 423));
    }

    // Check if user's password was changed after token was issued
    // This helps invalidate tokens when password is changed
    const tokenTimestamp = decoded.iat * 1000; // Convert to milliseconds
    if (user.passwordChangedAt && user.passwordChangedAt.getTime() > tokenTimestamp) {
      return next(new ErrorResponse('Password was recently changed. Please log in again.', 401));
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }
});

// Grant access to specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ErrorResponse('User not authenticated', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorResponse(
          `User role '${req.user.role}' is not authorized to access this route`,
          403
        )
      );
    }
    next();
  };
};

// Optional authentication - sets user if token is valid but doesn't require it
const optionalAuth = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.token) {
    token = req.cookies.token;
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).populate('addresses');
      
      if (user && user.accountStatus === 'active' && !user.isLocked) {
        req.user = user;
      }
    } catch (error) {
      // Silently fail for optional auth
      console.log('Optional auth failed:', error.message);
    }
  }

  next();
});

// Check if user owns resource or is admin
const checkOwnership = (resourceModel, resourceIdParam = 'id', userField = 'user') => {
  return asyncHandler(async (req, res, next) => {
    if (!req.user) {
      return next(new ErrorResponse('Authentication required', 401));
    }

    // Admin can access everything
    if (req.user.role === 'admin') {
      return next();
    }

    const resourceId = req.params[resourceIdParam];
    const Model = require(`../models/${resourceModel}`);
    
    const resource = await Model.findById(resourceId);
    
    if (!resource) {
      return next(new ErrorResponse(`${resourceModel} not found`, 404));
    }

    // Check ownership
    const resourceUserId = resource[userField] ? resource[userField].toString() : null;
    
    if (resourceUserId !== req.user._id.toString()) {
      return next(new ErrorResponse(`Not authorized to access this ${resourceModel.toLowerCase()}`, 403));
    }

    req.resource = resource;
    next();
  });
};

// Rate limiting for sensitive operations
const sensitiveOperationLimit = {
  // Track attempts per user
  attempts: new Map(),
  
  // Check if user has exceeded limit
  check: (userId, maxAttempts = 5, windowMs = 15 * 60 * 1000) => {
    const now = Date.now();
    const userAttempts = sensitiveOperationLimit.attempts.get(userId) || [];
    
    // Remove old attempts outside the window
    const recentAttempts = userAttempts.filter(timestamp => now - timestamp < windowMs);
    
    if (recentAttempts.length >= maxAttempts) {
      return false; // Limit exceeded
    }
    
    // Add current attempt
    recentAttempts.push(now);
    sensitiveOperationLimit.attempts.set(userId, recentAttempts);
    
    return true; // Within limit
  }
};

// Middleware for sensitive operations (password change, email change, etc.)
const rateLimitSensitive = (maxAttempts = 5, windowMs = 15 * 60 * 1000) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ErrorResponse('Authentication required', 401));
    }

    const userId = req.user._id.toString();
    
    if (!sensitiveOperationLimit.check(userId, maxAttempts, windowMs)) {
      return next(new ErrorResponse('Too many attempts. Please try again later.', 429));
    }

    next();
  };
};

// Middleware to check if user has verified email for certain operations
const requireEmailVerification = (req, res, next) => {
  if (!req.user) {
    return next(new ErrorResponse('Authentication required', 401));
  }

  if (!req.user.emailVerified) {
    return next(new ErrorResponse('Email verification required to perform this action', 403));
  }

  next();
};

// Middleware to check if user has verified phone for certain operations
const requirePhoneVerification = (req, res, next) => {
  if (!req.user) {
    return next(new ErrorResponse('Authentication required', 401));
  }

  if (!req.user.phoneVerified) {
    return next(new ErrorResponse('Phone verification required to perform this action', 403));
  }

  next();
};

// Middleware to check if two-factor authentication is enabled and verified
const requireTwoFactor = (req, res, next) => {
  if (!req.user) {
    return next(new ErrorResponse('Authentication required', 401));
  }

  if (req.user.twoFactorEnabled && !req.twoFactorVerified) {
    return next(new ErrorResponse('Two-factor authentication required', 403));
  }

  next();
};

// Middleware to log security events
const logSecurityEvent = (eventType) => {
  return (req, res, next) => {
    const event = {
      type: eventType,
      userId: req.user ? req.user._id : null,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date(),
      details: {
        method: req.method,
        url: req.originalUrl,
        body: req.method === 'POST' ? { ...req.body, password: '[REDACTED]' } : undefined
      }
    };

    // In production, you would send this to a logging service
    console.log('Security Event:', JSON.stringify(event, null, 2));
    
    next();
  };
};

// Check admin permissions for specific admin operations
const checkAdminPermission = (permission) => {
  return (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
      return next(new ErrorResponse('Admin access required', 403));
    }

    // In a more complex system, you'd check specific permissions here
    // For now, all admins have all permissions
    const adminPermissions = [
      'users:read',
      'users:write',
      'users:delete',
      'products:read',
      'products:write',
      'products:delete',
      'orders:read',
      'orders:write',
      'orders:delete',
      'analytics:read',
      'settings:write'
    ];

    if (permission && !adminPermissions.includes(permission)) {
      return next(new ErrorResponse(`Admin permission '${permission}' not found`, 403));
    }

    next();
  };
};

module.exports = {
  protect,
  authorize,
  optionalAuth,
  checkOwnership,
  rateLimitSensitive,
  requireEmailVerification,
  requirePhoneVerification,
  requireTwoFactor,
  logSecurityEvent,
  checkAdminPermission
};