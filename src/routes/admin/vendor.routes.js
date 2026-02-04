const express = require('express');
const router = express.Router();
const vendorControllers = require('../../controllers/admin/vendorControllers');
const { validate } = require('../../middleware/validator');
const {
  listVendorsValidation,
  getWarehouseStatusValidation,
  createVendorValidation,
  updateVendorValidation,
  deleteVendorValidation,
  retryWarehouseRegistrationValidation,
  saveVendorListValidation,
} = require('../../validations/admin/vendor.validation');

/**
 * @route   GET /api/v1/admin/vendors
 * @desc    List all vendors with enhanced filters
 * @access  Admin/Manager
 */
router.get('/', validate(listVendorsValidation), vendorControllers.listVendors);

/**
 * @route   GET /api/v1/admin/vendors/:id/warehouse/status
 * @desc    Get warehouse status for a vendor
 * @access  Admin/Manager
 */
router.get(
  '/:id/warehouse/status',
  validate(getWarehouseStatusValidation),
  vendorControllers.getWarehouseStatus
);

/**
 * @route   POST /api/v1/admin/vendors
 * @desc    Create vendor
 * @access  Admin/Manager
 */
router.post('/', validate(createVendorValidation), vendorControllers.createVendor);

/**
 * @route   PUT /api/v1/admin/vendors/:id
 * @desc    Update vendor
 * @access  Admin/Manager
 */
router.put('/:id', validate(updateVendorValidation), vendorControllers.updateVendor);

/**
 * @route   DELETE /api/v1/admin/vendors/:id
 * @desc    Delete vendor
 * @access  Admin/Manager
 */
router.delete('/:id', validate(deleteVendorValidation), vendorControllers.deleteVendor);

/**
 * @route   POST /api/v1/admin/vendors/:id/warehouse/retry
 * @desc    Retry warehouse registration
 * @access  Admin/Manager
 */
router.post(
  '/:id/warehouse/retry',
  validate(retryWarehouseRegistrationValidation),
  vendorControllers.retryWarehouseRegistration
);

/**
 * @route   POST /api/v1/admin/vendors/list-store
 * @desc    Save vendor list
 * @access  Admin/Manager
 */
router.post('/list-store', validate(saveVendorListValidation), vendorControllers.saveVendorList);

module.exports = router;
