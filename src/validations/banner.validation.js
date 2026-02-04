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
  params: z.object({
    id: mongoIdSchema,
  }),
  query: z.object({}).optional(),
  body: z.object({}).optional(),
});

module.exports = {
  getBannersValidation,
  getBannerByIdValidation,
  bannerTypeEnum,
  mongoIdSchema,
};
