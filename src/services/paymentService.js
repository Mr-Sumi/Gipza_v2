const Razorpay = require('razorpay');
const crypto = require('crypto');
const dotenv = require('dotenv');

dotenv.config();

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * Initiate payment with Razorpay
 * @param {number} amount - Amount in rupees
 * @param {string} receiptId - Receipt/Order ID
 * @returns {Promise<Object>} Razorpay order object
 */
const initiatePayment = async (amount, receiptId) => {
  const parsedAmount = parseFloat(amount);
  
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    throw new Error('Invalid amount provided for payment');
  }

  // Convert rupees to paise
  const amountInPaise = Math.round(parsedAmount * 100);

  if (amountInPaise < 100) {
    throw new Error('Amount must be at least ₹1 (100 paise)');
  }

  const options = {
    amount: amountInPaise,
    currency: 'INR',
    receipt: receiptId || `order_${Date.now()}`,
    payment_capture: 1,
  };

  try {
    const order = await razorpay.orders.create(options);
    return order;
  } catch (error) {
    console.error('Razorpay order creation failed:', error);
    throw new Error('Payment initiation failed');
  }
};

/**
 * Verify payment signature
 * @param {string} orderId - Razorpay order ID
 * @param {string} paymentId - Razorpay payment ID
 * @param {string} signature - Payment signature
 * @returns {Promise<Object>} Verification result
 */
const verifyPayment = async (orderId, paymentId, signature) => {
  const body = orderId + '|' + paymentId;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');

  const verified = expectedSignature === signature;

  return { verified };
};

/**
 * Process refund
 * @param {string} paymentId - Razorpay payment ID
 * @param {number} amount - Refund amount in rupees
 * @returns {Promise<Object>} Refund object
 */
const refundPayment = async (paymentId, amount) => {
  try {
    const refund = await razorpay.payments.refund(paymentId, {
      amount: Math.round(amount * 100), // Convert to paise
      speed: 'normal',
    });
    return refund;
  } catch (error) {
    console.error('Razorpay refund failed:', error);
    throw new Error('Refund initiation failed');
  }
};

module.exports = {
  initiatePayment,
  verifyPayment,
  refundPayment,
};

