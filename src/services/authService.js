const User = require('../models/User');
const { sendOtpSMS } = require('../config/smsService');
const { generateTokens, verifyRefreshToken } = require('../utils/jwt');

// Helper function to normalize phone number (remove +91 prefix if present)
const normalizePhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return phoneNumber;
  return phoneNumber.replace(/^\+91/, '').trim();
};

// Hardcoded phone numbers and OTPs for testing (normalized without +91)
const HARDCODED_PHONE_NUMBERS = ["9841543993", "9576320804","8235035277"];
const HARDCODED_OTP = "123456"; 
const ADMIN_PHONE_NUMBER = "9999999999";

/**
 * Send OTP to user's phone number
 * @param {string} phoneNumber - User's phone number
 * @returns {Promise<Object>} Object containing OTP details and user info
 */

const sendOTP = async (phoneNumber) => {
  if (!phoneNumber) {
    throw new Error('Phone number is required');
  }

  const normalizedPhone = normalizePhoneNumber(phoneNumber);
  const isHardcodedNumber = HARDCODED_PHONE_NUMBERS.includes(normalizedPhone);
  const isAdminNumber = normalizedPhone === ADMIN_PHONE_NUMBER;

  let otp, expiresAt;

  if (isHardcodedNumber || isAdminNumber) {
    // Use hardcoded OTP for testing numbers
    otp = HARDCODED_OTP;
    expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours expiry for hardcoded OTP
    console.log(`Hardcoded OTP used for ${phoneNumber} (normalized: ${normalizedPhone}): ${otp}`);
  } else {
    // Generate random OTP for other numbers
    otp = Math.floor(100000 + Math.random() * 900000);
    console.log(`Generated OTP for ${phoneNumber} (normalized: ${normalizedPhone}): ${otp}`);
    expiresAt = new Date(Date.now() + 10 * 60 * 1000); // OTP expires in 10 minutes
  }

  // Check if user exists (search with normalized phone number)
  let user = await User.findOne({ phoneNumber: normalizedPhone })
    .select('_id phoneNumber role otp');

  if (!user) {
    // Create a new user with only phone number
    user = new User({
      phoneNumber: normalizedPhone,
      role: "customer",
      otp: { code: otp, expiresAt },
    });
    await user.save();
  } else {
    // Update OTP for existing user
    user.otp = { code: otp, expiresAt };
    await user.save();
  }

  // Send SMS with OTP (only for non-hardcoded numbers)
  if (!isHardcodedNumber && !isAdminNumber) {
    try {
      await sendOtpSMS(phoneNumber, otp);
    } catch (smsError) {
      console.error("Error sending SMS:", smsError.message);
      // Continue even if SMS fails - OTP is still stored
    }
  }

  // Log OTP in the console for debugging
  console.log(`OTP sent to ${phoneNumber} (normalized: ${normalizedPhone}): ${otp}`);

  return {
    message: "OTP sent successfully",
    isHardcoded: isHardcodedNumber || isAdminNumber,
    otp: isAdminNumber ? otp : undefined, // Only return OTP for admin phone
  };
};

/**
 * Verify OTP and generate tokens
 * @param {string} phoneNumber - User's phone number
 * @param {string} otp - OTP code to verify
 * @param {string} fcmToken - Optional FCM token for push notifications
 * @returns {Promise<Object>} Object containing tokens and user info
 */
const verifyOTP = async (phoneNumber, otp, fcmToken = null) => {
  if (!phoneNumber || !otp) {
    throw new Error('Phone number and OTP are required');
  }

  // Normalize and validate phone number
  const normalizedPhone = normalizePhoneNumber(phoneNumber);
  const isHardcodedNumber = HARDCODED_PHONE_NUMBERS.includes(normalizedPhone);
  const isAdminNumber = normalizedPhone === ADMIN_PHONE_NUMBER;
  const isTestNumber = isHardcodedNumber || isAdminNumber;

  // Find user
  const user = await User.findOne({ phoneNumber: normalizedPhone })
    .select('_id name email phoneNumber role otp fcmToken refreshToken');
  if (!user) {
    throw new Error('User not found. Please request a new OTP.');
  }

  // Verify OTP
  let isOTPValid = false;
  
  if (isTestNumber) {
    // For test numbers, use hardcoded OTP
    isOTPValid = otp === HARDCODED_OTP;
    console.log(
      `Test OTP verification for ${phoneNumber} (normalized: ${normalizedPhone}): ${isOTPValid ? 'SUCCESS' : 'FAILED'}`
    );
  } else {
    // For regular numbers, validate against stored OTP
    if (!user.otp || !user.otp.code) {
      throw new Error('No OTP found. Please request a new OTP.');
    }
    
    const isExpired = user.otp.expiresAt <= Date.now();
    if (isExpired) {
      throw new Error('OTP has expired. Please request a new OTP.');
    }
    
    isOTPValid = user.otp.code === otp;
  }

  if (!isOTPValid) {
    throw new Error('Invalid OTP. Please try again.');
  }

  // Update user data
  if (fcmToken) {
    user.fcmToken = fcmToken;
  }
  user.otp = undefined; // Clear OTP after successful verification

  // Generate tokens
  const tokenPayload = { id: user._id, role: user.role };
  const { accessToken, refreshToken } = generateTokens(tokenPayload);

  // Store refresh token in database
  user.refreshToken = refreshToken;
  await user.save();

  // Return user data (excluding sensitive information)
  const userData = {
    id: user._id,
    name: user.name || null,
    email: user.email || null,
    phoneNumber: user.phoneNumber,
    role: user.role || "customer",
  };

  return {
    accessToken,
    refreshToken,
    user: userData,
  };
};

/**
 * Refresh access token using refresh token
 * @param {string} refreshToken - Refresh token
 * @returns {Promise<Object>} New access token
 */
const refreshAccessToken = async (refreshToken) => {
  if (!refreshToken) {
    throw new Error('Refresh token is required');
  }

  try {
    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);

    // Find user and verify refresh token matches
    const user = await User.findById(decoded.id)
      .select('_id role refreshToken');
    if (!user || user.refreshToken !== refreshToken) {
      throw new Error('Invalid refresh token');
    }

    // Generate new tokens
    const tokenPayload = { id: user._id, role: user.role };
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(tokenPayload);

    // Update refresh token in database
    user.refreshToken = newRefreshToken;
    await user.save();

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Refresh token has expired. Please login again.');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid refresh token');
    }
    throw error;
  }
};

/**
 * Logout user by invalidating refresh token
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
const logout = async (userId) => {
  const user = await User.findById(userId).select('_id refreshToken');
  if (user) {
    user.refreshToken = undefined;
    await user.save();
  }
};

module.exports = {
  sendOTP,
  verifyOTP,
  refreshAccessToken,
  logout,
};

