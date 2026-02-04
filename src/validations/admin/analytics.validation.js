const { z } = require('zod');

/**
 * Date validation schema
 */
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional();

/**
 * Sales report validation
 */
const getSalesReportValidation = z.object({
  query: z.object({
    startDate: dateSchema,
    endDate: dateSchema,
    groupBy: z.enum(['date', 'product', 'category']).optional().default('date'),
  }).optional(),
});

/**
 * Revenue report validation
 */
const getRevenueReportValidation = z.object({
  query: z.object({
    startDate: dateSchema,
    endDate: dateSchema,
    period: z.enum(['daily', 'weekly', 'monthly']).optional().default('daily'),
  }).optional(),
});

/**
 * Customer analytics validation
 */
const getCustomerAnalyticsValidation = z.object({
  query: z.object({
    startDate: dateSchema,
    endDate: dateSchema,
  }).optional(),
});

/**
 * Product analytics validation
 */
const getProductAnalyticsValidation = z.object({
  query: z.object({}).optional(),
});

/**
 * Inventory report validation
 */
const getInventoryReportValidation = z.object({
  query: z.object({
    lowStockThreshold: z.string().regex(/^\d+$/).optional(),
  }).optional(),
});

/**
 * Order analytics validation
 */
const getOrderAnalyticsValidation = z.object({
  query: z.object({
    startDate: dateSchema,
    endDate: dateSchema,
  }).optional(),
});

module.exports = {
  getSalesReportValidation,
  getRevenueReportValidation,
  getCustomerAnalyticsValidation,
  getProductAnalyticsValidation,
  getInventoryReportValidation,
  getOrderAnalyticsValidation,
};
