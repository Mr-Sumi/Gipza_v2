const axios = require("axios");
const dotenv = require("dotenv");

dotenv.config();

// Jovanet SMS configuration (values must be provided via environment variables)
const JOVANET_API_KEY = process.env.JOVANET_API_KEY;
const JOVANET_SENDER_ID = process.env.JOVANET_SENDER_ID;
const JOVANET_TEMPLATE_ID = process.env.JOVANET_TEMPLATE_ID;

// Fixed OTP message template – only the OTP value is variable
const OTP_MESSAGE_TEMPLATE =
  "Dear User, Your OTP for Login is {#var#} valid for 5 minutes. Please do not share this with anyone else. Team TECHZA SOLUTIONS PRIVATE LIMITED.";

/**
 * Generic SMS sender using Jovanet bulk SMS API
 * @param {string} phoneNumber - Destination mobile number
 * @param {string} message - Full SMS text (should match DLT template)
 */
const sendSMS = async (phoneNumber, message) => {
  const url = "http://bulksms.jovanet.in/V2/http-api-post.php";

  const data = {
    apikey: JOVANET_API_KEY,
    senderid: JOVANET_SENDER_ID,
    number: phoneNumber,
    template_id: JOVANET_TEMPLATE_ID,
    // tempid is kept as in the example; you can adjust or parameterize if needed
    tempid: "123654",
    message,
    format: "json",
  };

  try {
    const response = await axios.post(url, data, {
      headers: {
        "Content-Type": "application/json",
      },
      maxBodyLength: Infinity,
    });

    console.log("Jovanet SMS response:", response.data);
    return response.data;
  } catch (error) {
    console.error(
      "Error sending SMS via Jovanet:",
      error.response ? error.response.data : error.message
    );
    throw error;
  }
};

/**
 * OTP-specific sender: fixed message, only OTP value is substituted
 * @param {string} phoneNumber
 * @param {string|number} otp
 */
const sendOtpSMS = async (phoneNumber, otp) => {
  const message = OTP_MESSAGE_TEMPLATE.replace("{#var#}", String(otp));
  return sendSMS(phoneNumber, message);
};

module.exports = { sendSMS, sendOtpSMS };

