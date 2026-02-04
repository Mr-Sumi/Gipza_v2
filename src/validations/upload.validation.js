const { z } = require('zod');

const uploadImageValidation = z.object({
  body: z.object({}).strict().optional(),
  query: z.object({}).strict().optional(),
  params: z.object({}).strict().optional(),
});

const uploadVideoValidation = z.object({
  body: z.object({}).strict().optional(),
  query: z.object({}).strict().optional(),
  params: z.object({}).strict().optional(),
});

module.exports = {
  uploadImageValidation,
  uploadVideoValidation,
};
