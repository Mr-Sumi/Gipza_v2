const { z } = require('zod');

/**
 * Get Dashboard Stats Validation
 * GET /api/v1/admin/dashboard/stats
 */
const getDashboardStatsValidation = z.object({
  query: z.object({
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format').optional(),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format').optional(),
  }).optional(),
});

/**
 * Get Recent Orders Validation
 * GET /api/v1/admin/dashboard/recent-orders
 */
const getRecentOrdersValidation = z.object({
  query: z.object({
    limit: z.string().regex(/^\d+$/).optional().transform(Number).pipe(z.number().int().positive().max(100)),
  }).optional(),
});

/**
 * Get Sales Chart Data Validation
 * GET /api/v1/admin/dashboard/sales-chart
 */
const getSalesChartDataValidation = z.object({
  query: z.object({
    period: z.enum(['daily', 'weekly', 'monthly']).optional(),
    days: z.string().regex(/^\d+$/).optional().transform(Number).pipe(z.number().int().positive().max(365)),
  }).optional(),
});

/**
 * Get Top Selling Products Validation
 * GET /api/v1/admin/dashboard/top-products
 */
const getTopSellingProductsValidation = z.object({
  query: z.object({
    limit: z.string().regex(/^\d+$/).optional().transform(Number).pipe(z.number().int().positive().max(100)),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format').optional(),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format').optional(),
  }).optional(),
});

module.exports = {
  getDashboardStatsValidation,
  getRecentOrdersValidation,
  getSalesChartDataValidation,
  getTopSellingProductsValidation,
};

