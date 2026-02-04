const { z } = require('zod');

const mongoIdSchema = z.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid banner ID');
const bannerTypeEnum = z.enum(['banner', 'ai-cta']);

const getBannersValidation = z.object({
  query: z.object({
    active: z.enum(['true', 'false']).optional().transform((v) => v === 'true'),
    type: bannerTypeEnum.optional(),
    sort: z.string().max(50).optional().default('sortOrder'),
  }),
  params: z.object({}).optional(),
  body: z.object({}).optional(),
});

const getBannerByIdValidation = z.object({
  params: z.object({ id: mongoIdSchema }),
  query: z.object({}).optional(),
  body: z.object({}).optional(),
});

const createBannerValidation = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').max(120).trim(),
    type: z.preprocess((v) => (v === '' ? undefined : v), bannerTypeEnum.optional().default('banner')),
    active: z
      .preprocess((v) => (v === 'true' ? true : v === 'false' ? false : v), z.boolean().optional().default(true)),
    sortOrder: z.coerce.number().int().min(-999).max(999).optional().default(0),
    image: z.string().min(1, 'Image URL is required (from POST /upload/image)').trim(),
    image_key: z.string().min(1, 'Image key is required (from POST /upload/image)').trim(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

const updateBannerValidation = z.object({
  params: z.object({ id: mongoIdSchema }),
  body: z.object({
    name: z.string().min(1).max(120).trim().optional(),
    type: z.preprocess((v) => (v === '' ? undefined : v), bannerTypeEnum.optional()),
    active: z.preprocess((v) => (v === 'true' ? true : v === 'false' ? false : v), z.boolean().optional()),
    sortOrder: z.coerce.number().int().min(-999).max(999).optional(),
    image: z.string().url().optional(),
    image_key: z.string().min(1).optional(),
  }).refine(
    (data) => {
      const hasImage = data.image !== undefined && data.image !== '';
      const hasKey = data.image_key !== undefined && data.image_key !== '';
      return !(hasImage !== hasKey);
    },
    { message: 'When replacing image, both image and image_key must be provided (from POST /upload/image).' }
  ),
  query: z.object({}).optional(),
});

const deleteBannerValidation = z.object({
  params: z.object({ id: mongoIdSchema }),
  query: z.object({}).optional(),
  body: z.object({}).optional(),
});

module.exports = {
  getBannersValidation,
  getBannerByIdValidation,
  createBannerValidation,
  updateBannerValidation,
  deleteBannerValidation,
};
