const authService = require('../services/authService');

/**
 * Send OTP to user's phone number
 */
exports.sendOTP = async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    const result = await authService.sendOTP(phoneNumber);
    
    return res.status(200).json(result);
  } catch (error) {
    console.error("Error in sendOTP:", error);
    return res.status(400).json({ 
      message: error.message || "Failed to send OTP" 
    });
  }
};

/**
 * Verify OTP and return access & refresh tokens
 */
exports.verifyOTP = async (req, res) => {
  try {
    const { phoneNumber, otp, fcmToken } = req.body;

    const result = await authService.verifyOTP(phoneNumber, otp, fcmToken);
    
    return res.status(200).json({
      message: "OTP verified successfully",
      ...result,
    });
  } catch (error) {
    console.error("Error in verifyOTP:", error);
    
    // Determine appropriate status code
    const statusCode = error.message.includes('not found') || 
                       error.message.includes('Invalid') || 
                       error.message.includes('expired') 
                       ? 400 : 500;
    
    return res.status(statusCode).json({ 
      message: error.message || "Failed to verify OTP" 
    });
  }
};

/**
 * Refresh access token using refresh token
 */
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ 
        message: "Refresh token is required" 
      });
    }

    const result = await authService.refreshAccessToken(refreshToken);
    
    return res.status(200).json({
      message: "Token refreshed successfully",
      ...result,
    });
  } catch (error) {
    console.error("Error in refreshToken:", error);
    
    const statusCode = error.message.includes('expired') || 
                       error.message.includes('Invalid') 
                       ? 401 : 500;
    
    return res.status(statusCode).json({ 
      message: error.message || "Failed to refresh token" 
    });
  }
};

/**
 * Get current user profile
 * Requires authentication middleware
 */
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id; 
    
    const User = require('../models/User');
    const user = await User.findById(userId)
      .select('_id name email phoneNumber role gender dateOfBirth addresses wishlist createdAt updatedAt')
      .lean();
    
    if (!user) {
      return res.status(404).json({ 
        message: "User not found" 
      });
    }

    return res.status(200).json({
      user: {
        id: user._id,
        name: user.name || null,
        email: user.email || null,
        phoneNumber: user.phoneNumber,
        role: user.role || "customer",
        gender: user.gender || null,
        dateOfBirth: user.dateOfBirth || null,
        addresses: user.addresses || [],
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error in getProfile:", error);
    return res.status(500).json({ 
      message: error.message || "Failed to get profile" 
    });
  }
};

/**
 * Logout user (invalidate refresh token)
 * Requires authentication middleware
 */
exports.logout = async (req, res) => {
  try {
    const userId = req.user.id; 

    await authService.logout(userId);
    
    return res.status(200).json({ 
      message: "Logged out successfully" 
    });
  } catch (error) {
    console.error("Error in logout:", error);
    return res.status(500).json({ 
      message: error.message || "Failed to logout" 
    });
  }
};