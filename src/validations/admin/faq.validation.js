const { z } = require('zod');

const mongoIdSchema = z.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid FAQ ID');

const getFaqsValidation = z.object({
  query: z.object({
    sort: z.string().max(50).optional().default('updatedDate'),
    order: z.enum(['asc', 'desc']).optional().default('desc'),
    limit: z.coerce.number().int().min(1).max(500).optional(),
  }),
  params: z.object({}).optional(),
  body: z.object({}).optional(),
});

const getFaqByIdValidation = z.object({
  params: z.object({ id: mongoIdSchema }),
  query: z.object({}).optional(),
  body: z.object({}).optional(),
});

const createFaqValidation = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required').max(500).trim(),
    content: z.string().min(1, 'Content is required').max(50000).trim(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

const updateFaqValidation = z.object({
  params: z.object({ id: mongoIdSchema }),
  body: z.object({
    title: z.string().min(1).max(500).trim().optional(),
    content: z.string().min(1).max(50000).trim().optional(),
  }).refine((data) => data.title !== undefined || data.content !== undefined, {
    message: 'At least one of title or content must be provided',
  }),
  query: z.object({}).optional(),
});

const deleteFaqValidation = z.object({
  params: z.object({ id: mongoIdSchema }),
  query: z.object({}).optional(),
  body: z.object({}).optional(),
});

module.exports = {
  getFaqsValidation,
  getFaqByIdValidation,
  createFaqValidation,
  updateFaqValidation,
  deleteFaqValidation,
};
