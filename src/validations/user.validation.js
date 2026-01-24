const { z } = require('zod');

/**
 * Phone number schema (reusable)
 */
const phoneNumberSchema = z.string()
  .min(10, 'Phone number must be at least 10 digits')
  .max(13, 'Phone number must be at most 13 characters')
  .regex(/^(\+91)?[6-9]\d{9}$/, 'Invalid phone number format')
  .transform((val) => val.replace(/^\+91/, '').trim());

/**
 * Email schema (reusable)
 */
const emailSchema = z.string()
  .email('Invalid email format')
  .toLowerCase()
  .optional()
  .nullable();

/**
 * Gender enum schema
 */
const genderSchema = z.enum(['male', 'female', 'non-binary', 'prefer not to say'], {
  errorMap: () => ({ message: 'Gender must be one of: male, female, non-binary, prefer not to say' })
}).optional().nullable();

/**
 * Date of birth schema
 */
const dateOfBirthSchema = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of birth must be in YYYY-MM-DD format')
  .refine((date) => {
    const dob = new Date(date);
    const today = new Date();
    return dob < today;
  }, 'Date of birth must be in the past')
  .optional()
  .nullable()
  .transform((val) => val ? new Date(val) : null);

/**
 * Address schema
 */
const addressSchema = z.object({
  street: z.string().min(1, 'Street is required').optional().nullable(),
  city: z.string().min(1, 'City is required').optional().nullable(),
  state: z.string().min(1, 'State is required').optional().nullable(),
  zipCode: z.string()
    .regex(/^\d{6}$/, 'Zip code must be 6 digits')
    .optional()
    .nullable(),
  country: z.string().min(1, 'Country is required').optional().nullable(),
  phone: phoneNumberSchema.optional().nullable(),
  relationship: z.string().optional().nullable(),
  name: z.string().min(1, 'Contact name is required').optional().nullable(),
});

/**
 * Update Profile Validation Schema
 * PUT /api/v1/users/profile
 */
const updateProfileValidation = z.object({
  body: z.object({
    name: z.string()
      .min(2, 'Name must be at least 2 characters')
      .max(50, 'Name must be at most 50 characters')
      .optional()
      .nullable(),
    email: emailSchema,
    phoneNumber: phoneNumberSchema.optional().nullable(),
    gender: genderSchema,
    dateOfBirth: dateOfBirthSchema,
  }).refine(
    (data) => Object.keys(data).length > 0,
    { message: 'At least one field must be provided for update' }
  ),
});

/**
 * Add Address Validation Schema
 * POST /api/v1/users/address
 */
const addAddressValidation = z.object({
  body: addressSchema.refine(
    (data) => data.street || data.city || data.state,
    { message: 'At least one address field (street, city, or state) must be provided' }
  ),
});

/**
 * Update Address Validation Schema
 * PUT /api/v1/users/address/:addressId
 */
const updateAddressValidation = z.object({
  params: z.object({
    addressId: z.string()
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid address ID format')
      .min(1, 'Address ID is required'),
  }),
  body: addressSchema.partial().refine(
    (data) => Object.keys(data).length > 0,
    { message: 'At least one field must be provided for update' }
  ),
});

/**
 * Remove Address Validation Schema
 * DELETE /api/v1/users/address/:addressId
 */
const removeAddressValidation = z.object({
  params: z.object({
    addressId: z.string()
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid address ID format')
      .min(1, 'Address ID is required'),
  }),
});

/**
 * Add to Wishlist Validation Schema
 * POST /api/v1/users/wishlist/:productId
 */
const addToWishlistValidation = z.object({
  params: z.object({
    productId: z.string()
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID format')
      .min(1, 'Product ID is required'),
  }),
});

/**
 * Remove from Wishlist Validation Schema
 * DELETE /api/v1/users/wishlist/:productId
 */
const removeFromWishlistValidation = z.object({
  params: z.object({
    productId: z.string()
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID format')
      .min(1, 'Product ID is required'),
  }),
});

module.exports = {
  updateProfileValidation,
  addAddressValidation,
  updateAddressValidation,
  removeAddressValidation,
  addToWishlistValidation,
  removeFromWishlistValidation,
};

