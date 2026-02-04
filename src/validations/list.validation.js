const { z } = require('zod');

const listTypeEnum = [
  'vendor',
  'pincode',
  'category',
  'tag',
  'productTag',
  'size',
  'color',
  'occasion',
  'theme_banner',
  'theme_tabs',
  'theme_sections',
  'theme_pincode',
];

const saveListValidation = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').trim(),
    description: z.string().optional().nullable(),
    type: z.enum(listTypeEnum, {
      errorMap: () => ({ message: `Type must be one of: ${listTypeEnum.join(', ')}` }),
    }),
    content: z.any().refine((val) => val !== undefined && val !== null, {
      message: 'Content is required',
    }),
  }),
});

const getListsValidation = z.object({
  query: z.object({
    type: z.enum(listTypeEnum, {
      errorMap: () => ({ message: `Type must be one of: ${listTypeEnum.join(', ')}` }),
    }).optional(),
  }),
});

const getListByIdValidation = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid list ID format').min(1, 'List ID is required'),
  }),
});

const updateListValidation = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid list ID format').min(1, 'List ID is required'),
  }),
  body: z.object({
    name: z.string().min(1, 'Name is required').trim().optional(),
    description: z.string().optional().nullable(),
    content: z.any().optional(),
  }).refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  }),
});

const deleteListValidation = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid list ID format').min(1, 'List ID is required'),
  }),
});

module.exports = {
  saveListValidation,
  getListsValidation,
  getListByIdValidation,
  updateListValidation,
  deleteListValidation,
};
