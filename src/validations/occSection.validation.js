const { z } = require('zod');

const getAllOccSectionsValidation = z.object({
  query: z.object({
    active: z.enum(['true', 'false']).optional(),
  }),
});

const getOccSectionByIdValidation = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid occasion section ID format').min(1, 'Occasion section ID is required'),
  }),
});

const createOccSectionValidation = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').trim(),
    description: z.string().optional().nullable(),
    image: z.string().url('Invalid image URL').optional().nullable(),
    image_key: z.string().optional().nullable(),
    isActive: z.boolean().optional(),
    order: z.number().int().min(0).optional(),
  }),
});

const updateOccSectionValidation = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid occasion section ID format').min(1, 'Occasion section ID is required'),
  }),
  body: z.object({
    name: z.string().min(1, 'Name is required').trim().optional(),
    description: z.string().optional().nullable(),
    image: z.string().url('Invalid image URL').optional().nullable(),
    image_key: z.string().optional().nullable(),
    isActive: z.boolean().optional(),
    order: z.number().int().min(0).optional(),
  }).refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  }),
});

const deleteOccSectionValidation = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid occasion section ID format').min(1, 'Occasion section ID is required'),
  }),
});

module.exports = {
  getAllOccSectionsValidation,
  getOccSectionByIdValidation,
  createOccSectionValidation,
  updateOccSectionValidation,
  deleteOccSectionValidation,
};
