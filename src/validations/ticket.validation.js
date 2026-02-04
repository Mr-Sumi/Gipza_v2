const { z } = require('zod');

const mongoIdSchema = z.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid ID');
const statusEnum = z.enum(['open', 'in-progress', 'resolved', 'closed']);
const priorityEnum = z.enum(['low', 'medium', 'high']);

const createTicketValidation = z.object({
  body: z.object({
    subject: z.string().min(1, 'Subject is required').max(200).trim(),
    description: z.string().min(1, 'Description is required').trim(),
    category: z.string().min(1, 'Category is required').max(100).trim(),
    priority: priorityEnum.optional().default('medium'),
    imageUrl: z.string().url().optional().nullable().or(z.literal('')),
    orderId: z.union([mongoIdSchema, z.literal('')]).optional().transform((v) => (v === '' ? undefined : v)),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

const getUserTicketsValidation = z.object({
  query: z.object({
    status: statusEnum.optional(),
    category: z.string().max(100).optional(),
    hasOrder: z.enum(['true', 'false']).optional(),
  }),
  params: z.object({}).optional(),
  body: z.object({}).optional(),
});

const getTicketByIdValidation = z.object({
  params: z.object({ id: mongoIdSchema }),
  query: z.object({}).optional(),
  body: z.object({}).optional(),
});

const addCommentValidation = z.object({
  params: z.object({ id: mongoIdSchema }),
  body: z.object({
    text: z.string().min(1, 'Comment text is required').trim(),
    imageUrl: z.string().url().optional().nullable().or(z.literal('')),
  }),
  query: z.object({}).optional(),
});

const getAllTicketsValidation = z.object({
  query: z.object({
    status: statusEnum.optional(),
    category: z.string().max(100).optional(),
    priority: priorityEnum.optional(),
    hasOrder: z.enum(['true', 'false']).optional(),
  }),
  params: z.object({}).optional(),
  body: z.object({}).optional(),
});

const updateTicketStatusValidation = z.object({
  params: z.object({ id: mongoIdSchema }),
  body: z.object({ status: statusEnum }),
  query: z.object({}).optional(),
});

const assignTicketValidation = z.object({
  params: z.object({ id: mongoIdSchema }),
  body: z.object({ assignedTo: mongoIdSchema }),
  query: z.object({}).optional(),
});

module.exports = {
  createTicketValidation,
  getUserTicketsValidation,
  getTicketByIdValidation,
  addCommentValidation,
  getAllTicketsValidation,
  updateTicketStatusValidation,
  assignTicketValidation,
};
