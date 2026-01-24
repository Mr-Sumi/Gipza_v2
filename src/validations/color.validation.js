const { z } = require('zod');

/**
 * Hex color code schema
 */
const hexColorSchema = z.string()
  .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid hex color code format. Must be #RGB or #RRGGBB')
  .optional()
  .default('#FFFFFF');

/**
 * Color name schema
 */
const colorNameSchema = z.string()
  .min(2, 'Color name must be at least 2 characters')
  .max(50, 'Color name must be at most 50 characters')
  .trim();

/**
 * MongoDB ObjectId schema
 */
const objectIdSchema = z.string()
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid color ID format')
  .min(1, 'Color ID is required');

/**
 * Get Colors Validation Schema
 * GET /api/v1/colors
 */
const getColorsValidation = z.object({
  query: z.object({
    search: z.string().optional(),
    sort: z.enum(['name', '-name', 'createdAt', '-createdAt']).optional(),
  }).optional(),
});

/**
 * Create Color Validation Schema
 * POST /api/v1/colors
 */
const createColorValidation = z.object({
  body: z.object({
    name: colorNameSchema,
    hex: hexColorSchema,
  }),
});

/**
 * Update Color Validation Schema
 * PUT /api/v1/colors/:id
 */
const updateColorValidation = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.object({
    name: colorNameSchema.optional(),
    hex: hexColorSchema,
  }).refine(
    (data) => Object.keys(data).length > 0,
    { message: 'At least one field (name or hex) must be provided for update' }
  ),
});

/**
 * Delete Color Validation Schema
 * DELETE /api/v1/colors/:id
 */
const deleteColorValidation = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

/**
 * Get Single Color Validation Schema
 * GET /api/v1/colors/:id
 */
const getColorValidation = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

module.exports = {
  getColorsValidation,
  createColorValidation,
  updateColorValidation,
  deleteColorValidation,
  getColorValidation,
};

