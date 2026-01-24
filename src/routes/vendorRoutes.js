const express = require('express');
const router = express.Router();
const vendorControllers = require('../controllers/vendorControllers');
const { validate } = require('../middleware/validator');
const {
  getVendorByIdValidation,
  getVendorListValidation,
} = require('../validations/vendor.validation');

// Public routes
router.get('/', vendorControllers.getAllVendors);
router.get('/list', validate(getVendorListValidation), vendorControllers.getVendorLists);
router.get('/:id', validate(getVendorByIdValidation), vendorControllers.getVendorById);

// Note: Admin routes have been moved to /api/v1/admin/vendors

module.exports = router;

