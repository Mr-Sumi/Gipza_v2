const { z } = require('zod');
const mongoose = require('mongoose');

/**
 * MongoDB ObjectId validation
 */
const objectId = z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
  message: 'Invalid ObjectId format',
});

/**
 * List vendors validation (Admin - Enhanced)
 * GET /api/v1/admin/vendors
 */
const listVendorsValidation = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).optional().transform(Number).pipe(z.number().int().positive()),
    limit: z.string().regex(/^\d+$/).optional().transform(Number).pipe(z.number().int().positive().max(100)),
    status: z.enum(['draft', 'published']).optional(),
    search: z.string().optional(),
    warehouse_status: z.enum(['pending', 'registered', 'failed', 'retrying']).optional(),
    sort: z.string().optional(),
  }).optional(),
});

/**
 * Get warehouse status validation (Admin)
 * GET /api/v1/admin/vendors/:id/warehouse/status
 */
const getWarehouseStatusValidation = z.object({
  params: z.object({
    id: objectId,
  }),
});

/**
 * Reuse existing validations from vendor.validation.js
 */
const {
  createVendorValidation,
  updateVendorValidation,
  deleteVendorValidation,
  retryWarehouseRegistrationValidation,
  saveVendorListValidation,
} = require('../vendor.validation');

module.exports = {
  listVendorsValidation,
  getWarehouseStatusValidation,
  createVendorValidation,
  updateVendorValidation,
  deleteVendorValidation,
  retryWarehouseRegistrationValidation,
  saveVendorListValidation,
};
