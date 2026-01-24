const { z } = require('zod');
const mongoose = require('mongoose');

/**
 * MongoDB ObjectId validation
 */
const objectId = z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
  message: 'Invalid ObjectId format',
});

/**
 * Phone number schema
 */
const phoneNumberSchema = z.string()
  .trim()
  .min(10, 'Phone number must be at least 10 digits')
  .max(15, 'Phone number cannot exceed 15 digits')
  .regex(/^\+?(\d{1,3})?[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/, 'Invalid phone number format');

/**
 * Pincode schema (6 digits)
 */
const pincodeSchema = z.string()
  .trim()
  .length(6, 'Pincode must be exactly 6 digits')
  .regex(/^\d+$/, 'Pincode must be numeric');

/**
 * Create vendor validation
 */
const createVendorValidation = z.object({
  body: z.object({
    name: z.string().trim().min(2, 'Vendor name must be at least 2 characters').max(100, 'Vendor name cannot exceed 100 characters'),
    email: z.string().email('Invalid email format').optional().or(z.literal('')),
    address: z.string().trim().min(5, 'Address must be at least 5 characters'),
    pincode: pincodeSchema,
    city: z.string().trim().min(2, 'City must be at least 2 characters'),
    state: z.string().trim().min(2, 'State must be at least 2 characters'),
    country: z.string().trim().min(2, 'Country must be at least 2 characters').default('India'),
    contactName: z.string().trim().optional(),
    contactNumber: phoneNumberSchema,
    notes: z.string().trim().optional(),
    delhiveryPickupLocationName: z.string().trim().optional(),
    gstin: z.string().trim().optional(),
    status: z.enum(['draft', 'published']).default('published'),
    deliverablePincodes: z.array(z.string()).optional(),
  }),
});

/**
 * Update vendor validation
 */
const updateVendorValidation = z.object({
  params: z.object({
    id: objectId,
  }),
  body: z.object({
    name: z.string().trim().min(2, 'Vendor name must be at least 2 characters').max(100, 'Vendor name cannot exceed 100 characters').optional(),
    email: z.string().email('Invalid email format').optional().or(z.literal('')),
    address: z.string().trim().min(5, 'Address must be at least 5 characters').optional(),
    pincode: pincodeSchema.optional(),
    city: z.string().trim().min(2, 'City must be at least 2 characters').optional(),
    state: z.string().trim().min(2, 'State must be at least 2 characters').optional(),
    country: z.string().trim().min(2, 'Country must be at least 2 characters').optional(),
    contactName: z.string().trim().optional(),
    contactNumber: phoneNumberSchema.optional(),
    notes: z.string().trim().optional(),
    delhiveryPickupLocationName: z.string().trim().optional(),
    gstin: z.string().trim().optional(),
    status: z.enum(['draft', 'published']).optional(),
    deliverablePincodes: z.array(z.string()).optional(),
  }),
});

/**
 * Get vendor by ID validation
 */
const getVendorByIdValidation = z.object({
  params: z.object({
    id: objectId,
  }),
});

/**
 * Delete vendor validation
 */
const deleteVendorValidation = z.object({
  params: z.object({
    id: objectId,
  }),
});

/**
 * Retry warehouse registration validation
 */
const retryWarehouseRegistrationValidation = z.object({
  params: z.object({
    id: objectId,
  }),
});

/**
 * Get vendor list validation
 */
const getVendorListValidation = z.object({
  query: z.object({
    type: z.enum(['vendor', 'pincode', 'category', 'tag', 'productTag', 'size', 'color', 'occasion', 'theme_banner', 'theme_tabs', 'theme_sections', 'theme_pincode']).optional(),
  }),
});

/**
 * Save vendor list validation
 */
const saveVendorListValidation = z.object({
  body: z.object({
    name: z.string().trim().min(1, 'List name is required'),
    description: z.string().trim().optional(),
    type: z.enum(['vendor', 'pincode', 'category', 'tag', 'productTag', 'size', 'color', 'occasion', 'theme_banner', 'theme_tabs', 'theme_sections', 'theme_pincode']),
    content: z.any(), // Mixed type for flexible content
  }),
});

module.exports = {
  createVendorValidation,
  updateVendorValidation,
  getVendorByIdValidation,
  deleteVendorValidation,
  retryWarehouseRegistrationValidation,
  getVendorListValidation,
  saveVendorListValidation,
};

