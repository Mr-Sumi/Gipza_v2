const { z } = require('zod');

/**
 * Image URL schema (reusable)
 */
const imageUrlSchema = z.string()
  .url('Invalid image URL format')
  .optional()
  .nullable();

/**
 * Category name schema
 */
const categoryNameSchema = z.string()
  .min(2, 'Category name must be at least 2 characters')
  .max(50, 'Category name must be at most 50 characters')
  .trim();

/**
 * MongoDB ObjectId schema
 */
const objectIdSchema = z.string()
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid category ID format')
  .min(1, 'Category ID is required');

/**
 * Get Categories Validation Schema
 * GET /api/v1/categories
 * No validation needed for GET, but keeping for consistency
 */
const getCategoriesValidation = z.object({
  query: z.object({
    search: z.string().optional(),
    sort: z.enum(['name', '-name', 'createdAt', '-createdAt']).optional(),
  }).optional(),
});

/**
 * Create Category Validation Schema
 * POST /api/v1/categories
 */
const createCategoryValidation = z.object({
  body: z.object({
    name: categoryNameSchema,
    image: imageUrlSchema,
  }),
});

/**
 * Update Category Validation Schema
 * PUT /api/v1/categories/:id
 */
const updateCategoryValidation = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.object({
    name: categoryNameSchema.optional(),
    image: imageUrlSchema,
  }).refine(
    (data) => Object.keys(data).length > 0,
    { message: 'At least one field (name or image) must be provided for update' }
  ),
});

/**
 * Delete Category Validation Schema
 * DELETE /api/v1/categories/:id
 */
const deleteCategoryValidation = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

/**
 * Get Single Category Validation Schema
 * GET /api/v1/categories/:id
 */
const getCategoryValidation = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

module.exports = {
  getCategoriesValidation,
  createCategoryValidation,
  updateCategoryValidation,
  deleteCategoryValidation,
  getCategoryValidation,
};

