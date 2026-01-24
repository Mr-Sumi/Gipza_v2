const { verifyAccessToken } = require('../utils/jwt');
const User = require('../models/User');

/**
 * Authentication middleware to protect routes
 * Verifies access token and attaches user to request object
 */
const authenticate = async (req, res, next) => {
  try {

    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        message: 'Access token is required' 
      });
    }


    const token = authHeader.substring(7); 

    const decoded = verifyAccessToken(token);


    const user = await User.findById(decoded.id)
      .select('_id role phoneNumber name email')
      .lean();
    
    if (!user) {
      return res.status(401).json({ 
        message: 'User not found' 
      });
    }

    // Attach user to request object 
    req.user = {
      id: user._id,
      role: user.role,
      phoneNumber: user.phoneNumber,
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Access token has expired. Please refresh your token.' 
      });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        message: 'Invalid access token' 
      });
    }
    
    console.error('Auth middleware error:', error);
    return res.status(500).json({ 
      message: 'Authentication error' 
    });
  }
};

/**
 * Authorization middleware to restrict access based on roles
 * @param {...string|string[]} roles - Allowed roles (can be individual roles or an array)
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        message: 'Authentication required' 
      });
    }

    // Flatten roles array in case an array was passed (e.g., authorize(['admin', 'manager']))
    const allowedRoles = roles.flat();

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        role: req.user.role,
        allowedRoles: allowedRoles,
        message: 'Access denied. Insufficient permissions.' 
      });
    }

    next();
  };
};

module.exports = {
  authenticate,
  authorize,
};

