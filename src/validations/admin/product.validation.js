const { z } = require('zod');
const mongoose = require('mongoose');

/**
 * MongoDB ObjectId validation
 */
const objectId = z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
  message: 'Invalid ObjectId format',
});

/**
 * List products validation (Admin - Enhanced)
 * GET /api/v1/admin/products
 */
const listProductsValidation = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).optional().transform(Number).pipe(z.number().int().positive()),
    limit: z.string().regex(/^\d+$/).optional().transform(Number).pipe(z.number().int().positive().max(100)),
    status: z.enum(['draft', 'published']).optional(),
    category: z.union([z.string(), z.array(z.string())]).optional(),
    vendor: z.string().optional(),
    search: z.string().optional(),
    stock_status: z.enum(['in_stock', 'out_of_stock', 'low_stock']).optional(),
    sort: z.string().optional(),
  }).optional(),
});

/**
 * Get product details validation (Admin)
 * GET /api/v1/admin/products/:id
 */
const getProductDetailsValidation = z.object({
  params: z.object({
    id: objectId,
  }),
});

/**
 * Reuse existing validations from product.validation.js
 */
const {
  createProductValidation,
  updateProductValidation,
  updateProductStatusValidation,
  updateProductStockValidation,
  deleteProductValidation,
  duplicateProductValidation,
  addVideoValidation,
  updateProductVideoValidation,
  removeVideoFromProductValidation,
  saveProductListsValidation,
} = require('../product.validation');

module.exports = {
  listProductsValidation,
  getProductDetailsValidation,
  createProductValidation,
  updateProductValidation,
  updateProductStatusValidation,
  updateProductStockValidation,
  deleteProductValidation,
  duplicateProductValidation,
  addVideoValidation,
  updateProductVideoValidation,
  removeVideoFromProductValidation,
  saveProductListsValidation,
};
