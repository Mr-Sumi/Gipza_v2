const { z } = require('zod');

/**
 * Get All Users Validation (Admin)
 * GET /api/v1/admin/users
 */
const getAllUsersValidation = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).optional().transform(Number).pipe(z.number().int().positive()),
    limit: z.string().regex(/^\d+$/).optional().transform(Number).pipe(z.number().int().positive().max(100)),
    role: z.enum(['customer', 'admin', 'manager', 'executive']).optional(),
    search: z.string().optional(),
  }).optional(),
});

/**
 * Get User By ID Validation (Admin)
 * GET /api/v1/admin/users/:id
 */
const getUserByIdValidation = z.object({
  params: z.object({
    id: z.string().min(1, 'User ID is required'),
  }),
});

/**
 * Update User Validation (Admin)
 * PUT /api/v1/admin/users/:id
 */
const updateUserValidation = z.object({
  params: z.object({
    id: z.string().min(1, 'User ID is required'),
  }),
  body: z.object({
    name: z.string().optional(),
    email: z.string().email('Invalid email format').optional(),
    phoneNumber: z.string().optional(),
    role: z.enum(['customer', 'admin', 'manager', 'executive']).optional(),
    gender: z.enum(['male', 'female', 'non-binary', 'prefer not to say']).optional(),
    dateOfBirth: z.string().optional(),
    addresses: z.array(z.any()).optional(),
    fcmToken: z.string().optional(),
  }).optional(),
});

/**
 * Delete User Validation (Admin)
 * DELETE /api/v1/admin/users/:id
 */
const deleteUserValidation = z.object({
  params: z.object({
    id: z.string().min(1, 'User ID is required'),
  }),
});

/**
 * Search Users Validation (Admin)
 * GET /api/v1/admin/users/search
 */
const searchUsersValidation = z.object({
  query: z.object({
    q: z.string().min(1, 'Search query is required'),
    limit: z.string().regex(/^\d+$/).optional().transform(Number).pipe(z.number().int().positive().max(100)),
  }),
});

module.exports = {
  getAllUsersValidation,
  getUserByIdValidation,
  updateUserValidation,
  deleteUserValidation,
  searchUsersValidation,
};

