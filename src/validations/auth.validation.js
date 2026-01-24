const { z } = require('zod');

/**
 * Helper function to normalize phone number validation
 * Accepts phone numbers with or without +91 prefix
 */
const phoneNumberSchema = z.string()
  .min(10, 'Phone number must be at least 10 digits')
  .max(13, 'Phone number must be at most 13 characters')
  .regex(/^(\+91)?[6-9]\d{9}$/, 'Invalid phone number format. Must be 10 digits starting with 6-9, optionally prefixed with +91')
  .transform((val) => {
    // Remove +91 prefix if present for normalization
    return val.replace(/^\+91/, '').trim();
  });

/**
 * Send OTP Validation Schema
 * POST /api/auth/send-otp
 */
const sendOTPValidation = z.object({
  body: z.object({
    phoneNumber: phoneNumberSchema,
  }),
});

/**
 * Verify OTP Validation Schema
 * POST /api/auth/verify-otp
 */
const verifyOTPValidation = z.object({
  body: z.object({
    phoneNumber: phoneNumberSchema,
    otp: z.string()
      .length(6, 'OTP must be exactly 6 digits')
      .regex(/^\d{6}$/, 'OTP must contain only digits'),
    fcmToken: z.string()
      .optional()
      .nullable(),
  }),
});

/**
 * Refresh Token Validation Schema
 * POST /api/auth/refresh-token
 */
const refreshTokenValidation = z.object({
  body: z.object({
    refreshToken: z.string()
      .min(1, 'Refresh token is required')
      .trim(),
  }),
});

module.exports = {
  sendOTPValidation,
  verifyOTPValidation,
  refreshTokenValidation,
};

