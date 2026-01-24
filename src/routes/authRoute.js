const express = require('express');
const router = express.Router();
const authController = require('../controllers/authControllers');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validator');
const {
  sendOTPValidation,
  verifyOTPValidation,
  refreshTokenValidation,
} = require('../validations/auth.validation');


router.post('/send-otp', validate(sendOTPValidation), authController.sendOTP);
router.post('/verify-otp', validate(verifyOTPValidation), authController.verifyOTP);
router.post('/refresh-token', validate(refreshTokenValidation), authController.refreshToken);


router.get('/me', authenticate, authController.getProfile);
router.post('/logout', authenticate, authController.logout);

module.exports = router;

