const { z } = require('zod');
const mongoose = require('mongoose');

/**
 * MongoDB ObjectId validation
 */
const objectId = z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
  message: 'Invalid ObjectId format',
});

/**
 * Common schemas
 */
const priceSchema = z.number().min(0, 'Price must be non-negative').or(z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid price format').transform(Number));

const videoSchema = z.object({
  url: z.string().url('Invalid video URL'),
  key: z.string().min(1, 'Video key is required'),
  title: z.string().optional(),
  description: z.string().optional(),
  duration: z.number().optional(),
  size: z.number().optional(),
});

/**
 * Get All Products Validation
 * GET /api/v1/products
 */
const getAllProductsValidation = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).optional().transform(Number).pipe(z.number().int().positive()),
    limit: z.string().regex(/^\d+$/).optional().transform(Number).pipe(z.number().int().positive().max(100)),
    category: z.string().optional(),
    status: z.enum(['draft', 'published']).optional(),
    search: z.string().optional(),
    sort: z.string().optional(),
  }).optional(),
});

/**
 * Search Products Validation
 * GET/POST /api/v1/products/search
 */
const searchProductsValidation = z.object({
  query: z.object({
    query: z.string().optional(),
    category: z.union([z.string(), z.array(z.string())]).optional(),
    minPrice: z.string().regex(/^\d+(\.\d{1,2})?$/).optional().transform(Number),
    maxPrice: z.string().regex(/^\d+(\.\d{1,2})?$/).optional().transform(Number),
    gender: z.union([z.string(), z.array(z.string())]).optional(),
    color: z.union([z.string(), z.array(z.string())]).optional(),
    status: z.union([z.string(), z.array(z.string())]).optional(),
    page: z.string().regex(/^\d+$/).optional().transform(Number).pipe(z.number().int().positive()),
    limit: z.string().regex(/^\d+$/).optional().transform(Number).pipe(z.number().int().positive().max(100)),
    sort: z.enum(['low_to_high', 'high_to_low']).optional(),
  }).optional(),
  body: z.object({
    query: z.string().optional(),
    category: z.union([z.string(), z.array(z.string())]).optional(),
    minPrice: z.number().optional(),
    maxPrice: z.number().optional(),
    gender: z.union([z.string(), z.array(z.string())]).optional(),
    color: z.union([z.string(), z.array(z.string())]).optional(),
    status: z.union([z.string(), z.array(z.string())]).optional(),
    page: z.number().int().positive().optional(),
    limit: z.number().int().positive().max(100).optional(),
    sort: z.enum(['low_to_high', 'high_to_low']).optional(),
  }).optional(),
});

/**
 * Get Product Validation
 * GET /api/v1/products/:id
 */
const getProductValidation = z.object({
  params: z.object({
    id: objectId,
  }),
});

/**
 * Get Similar Products Validation
 * GET /api/v1/products/:id/similar
 */
const getSimilarProductsValidation = z.object({
  params: z.object({
    id: objectId,
  }),
});

/**
 * Get Combo Deals Validation
 * GET /api/v1/products/combo-deals
 */
const getComboDealsValidation = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).optional().transform(Number).pipe(z.number().int().positive()),
    limit: z.string().regex(/^\d+$/).optional().transform(Number).pipe(z.number().int().positive().max(100)),
    category: z.string().optional(),
    minPrice: z.string().regex(/^\d+(\.\d{1,2})?$/).optional().transform(Number),
    maxPrice: z.string().regex(/^\d+(\.\d{1,2})?$/).optional().transform(Number),
    sort: z.string().optional(),
  }).optional(),
});

/**
 * Create Product Validation
 * POST /api/v1/products
 */
const createProductValidation = z.object({
  body: z.object({
    name: z.string().min(2, 'Product name must be at least 2 characters').max(200, 'Product name cannot exceed 200 characters'),
    description: z.string().optional(),
    sku: z.string().min(1, 'SKU is required').max(100, 'SKU cannot exceed 100 characters'),
    status: z.enum(['draft', 'published']).optional(),
    isActive: z.boolean().optional(),
    isVisible: z.boolean().optional(),
    sellingPrice: priceSchema,
    comparePrice: priceSchema.optional(),
    vendor: objectId,
    vendorName: z.string().optional(),
    purchaseCost: z.number().optional(),
    tax: z.number().optional(),
    otherCost: z.number().optional(),
    totalCost: z.number().optional(),
    category: z.union([z.string(), z.array(z.string())]).optional(),
    tags: z.union([z.string(), z.array(z.string())]).optional(),
    productTags: z.union([z.string(), z.array(z.string())]).optional(),
    colors: z.union([z.string(), z.array(z.string())]).optional(),
    occasion: z.union([z.string(), z.array(z.string())]).optional(),
    sizes: z.union([z.string(), z.array(z.string())]).optional(),
    gender: z.union([z.string(), z.array(z.string())]).optional(),
    thumbnail: z.string().url('Invalid thumbnail URL').optional(),
    images: z.union([z.string(), z.array(z.string().url('Invalid image URL'))]).optional(),
    videos: z.union([videoSchema, z.array(videoSchema)]).optional(),
    stock: z.number().int().min(0, 'Stock cannot be negative').optional(),
    isCombo: z.boolean().optional(),
    relatedProducts: z.union([objectId, z.array(objectId)]).optional(),
    addOnProducts: z.union([objectId, z.array(objectId)]).optional(),
    materialType: z.string().optional(),
    weight: z.number().min(0).optional(),
    width: z.number().min(0).optional(),
    height: z.number().min(0).optional(),
    length: z.number().min(0).optional(),
    hsnCode: z.string().optional(),
    highlights: z.string().optional(),
    moreInfo: z.string().optional(),
    deliveryMode: z.enum(['manual', 'automatic', 'automatic+manual', 'manual+automatic']).optional(),
    deliverablePincodes: z.array(z.object({
      code: z.string(),
      area: z.string().optional(),
      city: z.string().optional(),
    })).optional(),
    distanceBasedDelivery: z.object({
      enabled: z.boolean().optional(),
      ranges: z.array(z.object({
        minDistance: z.number().optional(),
        maxDistance: z.number().optional(),
        price: z.number().optional(),
        deliveryTime: z.string().optional(),
      })).optional(),
    }).optional(),
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),
    keywords: z.union([z.string(), z.array(z.string())]).optional(),
    isCustomizable: z.boolean().optional(),
  }),
});

/**
 * Update Product Validation
 * PUT /api/v1/products/:id
 */
const updateProductValidation = z.object({
  params: z.object({
    id: objectId,
  }),
  body: z.object({
    name: z.string().min(2).max(200).optional(),
    description: z.string().optional(),
    sku: z.string().min(1).max(100).optional(),
    status: z.enum(['draft', 'published']).optional(),
    isActive: z.boolean().optional(),
    isVisible: z.boolean().optional(),
    sellingPrice: priceSchema.optional(),
    comparePrice: priceSchema.optional(),
    vendor: objectId.optional(),
    vendorName: z.string().optional(),
    purchaseCost: z.number().optional(),
    tax: z.number().optional(),
    otherCost: z.number().optional(),
    totalCost: z.number().optional(),
    category: z.union([z.string(), z.array(z.string())]).optional(),
    tags: z.union([z.string(), z.array(z.string())]).optional(),
    productTags: z.union([z.string(), z.array(z.string())]).optional(),
    colors: z.union([z.string(), z.array(z.string())]).optional(),
    occasion: z.union([z.string(), z.array(z.string())]).optional(),
    sizes: z.union([z.string(), z.array(z.string())]).optional(),
    gender: z.union([z.string(), z.array(z.string())]).optional(),
    thumbnail: z.string().url().optional(),
    images: z.union([z.string(), z.array(z.string().url())]).optional(),
    videos: z.union([videoSchema, z.array(videoSchema)]).optional(),
    stock: z.number().int().min(0).optional(),
    isCombo: z.boolean().optional(),
    relatedProducts: z.union([objectId, z.array(objectId)]).optional(),
    addOnProducts: z.union([objectId, z.array(objectId)]).optional(),
    materialType: z.string().optional(),
    weight: z.number().min(0).optional(),
    width: z.number().min(0).optional(),
    height: z.number().min(0).optional(),
    length: z.number().min(0).optional(),
    hsnCode: z.string().optional(),
    highlights: z.string().optional(),
    moreInfo: z.string().optional(),
    deliveryMode: z.enum(['manual', 'automatic', 'automatic+manual', 'manual+automatic']).optional(),
    deliverablePincodes: z.array(z.object({
      code: z.string(),
      area: z.string().optional(),
      city: z.string().optional(),
    })).optional(),
    distanceBasedDelivery: z.object({
      enabled: z.boolean().optional(),
      ranges: z.array(z.object({
        minDistance: z.number().optional(),
        maxDistance: z.number().optional(),
        price: z.number().optional(),
        deliveryTime: z.string().optional(),
      })).optional(),
    }).optional(),
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),
    keywords: z.union([z.string(), z.array(z.string())]).optional(),
    isCustomizable: z.boolean().optional(),
  }).refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  }),
});

/**
 * Update Product Status Validation
 * PATCH /api/v1/products/:id/status
 */
const updateProductStatusValidation = z.object({
  params: z.object({
    id: objectId,
  }),
  body: z.object({
    status: z.enum(['draft', 'published'], {
      required_error: 'Status is required',
      invalid_type_error: 'Status must be either "draft" or "published"',
    }),
  }),
});

/**
 * Update Product Stock Validation
 * PATCH /api/v1/products/:id/stock
 */
const updateProductStockValidation = z.object({
  params: z.object({
    id: objectId,
  }),
  body: z.object({
    stock: z.number().int().min(0, 'Stock cannot be negative'),
  }),
});

/**
 * Delete Product Validation
 * DELETE /api/v1/products/:id
 */
const deleteProductValidation = z.object({
  params: z.object({
    id: objectId,
  }),
});

/**
 * Add Video to Product Validation
 * POST /api/v1/products/:id/videos
 */
const addVideoToProductValidation = z.object({
  params: z.object({
    id: objectId,
  }),
  body: videoSchema,
});

/**
 * Update Product Video Validation
 * PUT /api/v1/products/:id/videos/:videoKey
 */
const updateProductVideoValidation = z.object({
  params: z.object({
    id: objectId,
    videoKey: z.string().min(1, 'Video key is required'),
  }),
  body: videoSchema.partial(),
});

/**
 * Remove Video from Product Validation
 * DELETE /api/v1/products/:id/videos/:videoKey
 */
const removeVideoFromProductValidation = z.object({
  params: z.object({
    id: objectId,
    videoKey: z.string().min(1, 'Video key is required'),
  }),
});

/**
 * Add Review Validation
 * POST /api/v1/products/:id/review
 */
const addReviewValidation = z.object({
  params: z.object({
    id: objectId,
  }),
  body: z.object({
    rating: z.enum(['1.0', '2.0', '3.0', '4.0', '5.0'], {
      required_error: 'Rating is required',
      invalid_type_error: 'Rating must be between 1.0 and 5.0',
    }),
    comment: z.string().optional(),
  }),
});

/**
 * Duplicate Product Validation
 * POST /api/v1/products/:id/duplicate
 */
const duplicateProductValidation = z.object({
  params: z.object({
    id: objectId,
  }),
  body: z.object({
    newSku: z.string().min(1, 'New SKU is required').max(100),
    newName: z.string().min(2).max(200).optional(),
    overrides: z.record(z.any()).optional(),
  }),
});

/**
 * Save Product Lists Validation
 * POST /api/v1/products/save-lists
 */
const saveProductListsValidation = z.object({
  body: z.object({
    lists: z.record(z.object({
      name: z.string().min(1, 'List name is required'),
      description: z.string().optional(),
      content: z.union([z.string(), z.array(z.string())]),
    })),
  }),
});

module.exports = {
  getAllProductsValidation,
  searchProductsValidation,
  getProductValidation,
  getSimilarProductsValidation,
  getComboDealsValidation,
  createProductValidation,
  updateProductValidation,
  updateProductStatusValidation,
  updateProductStockValidation,
  deleteProductValidation,
  addVideoValidation: addVideoToProductValidation,
  updateProductVideoValidation,
  removeVideoFromProductValidation,
  addReviewValidation,
  duplicateProductValidation,
  saveProductListsValidation,
};

