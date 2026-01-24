const productService = require('../services/productService');

/**
 * Get all products
 * GET /api/v1/products
 */
exports.getAllProducts = async (req, res) => {
  try {
    const { page, limit, category, status, search, sort } = req.query;
    
    const result = await productService.getAllProducts({
      page,
      limit,
      category,
      status,
      search,
      sort,
    });

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Error in getAllProducts:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch products',
    });
  }
};

/**
 * Get single product
 * GET /api/v1/products/:id
 */
exports.getProduct = async (req, res) => {
  try {
    const { id } = req.params;
    
    const product = await productService.getProduct(id);

    return res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error('Error in getProduct:', error);
    
    const statusCode = error.message === 'Product not found' ? 404 : 500;
    
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to fetch product',
    });
  }
};

/**
 * Search products
 * GET/POST /api/v1/products/search
 */
exports.searchProducts = async (req, res) => {
  try {
    // Support both GET and POST methods
    const filters = req.method === 'GET' ? req.query : req.body;
    
    const result = await productService.searchProducts(filters);

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Error in searchProducts:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to search products',
    });
  }
};

/**
 * Get unique tags
 * GET /api/v1/products/tags
 */
exports.getUniqueTags = async (req, res) => {
  try {
    const tags = await productService.getUniqueTags();

    return res.status(200).json({
      success: true,
      tags,
    });
  } catch (error) {
    console.error('Error in getUniqueTags:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch tags',
    });
  }
};

/**
 * Get similar products
 * GET /api/v1/products/:id/similar
 */
exports.getSimilarProducts = async (req, res) => {
  try {
    const { id } = req.params;
    
    const products = await productService.getSimilarProducts(id);

    return res.status(200).json({
      success: true,
      data: products,
    });
  } catch (error) {
    console.error('Error in getSimilarProducts:', error);
    
    const statusCode = error.message === 'Product not found' ? 404 : 500;
    
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to fetch similar products',
    });
  }
};

/**
 * Get combo deals
 * GET /api/v1/products/combo-deals
 */
exports.getComboDeals = async (req, res) => {
  try {
    const { page, limit, category, minPrice, maxPrice, sort } = req.query;
    
    const result = await productService.getComboDeals({
      page,
      limit,
      category,
      minPrice,
      maxPrice,
      sort,
    });

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Error in getComboDeals:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch combo deals',
    });
  }
};

/**
 * Add review to product
 * POST /api/v1/products/:id/review
 */
exports.addReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.id;
    
    const product = await productService.addReview(id, userId, { rating, comment });

    return res.status(201).json({
      success: true,
      message: 'Review added successfully',
      data: product,
    });
  } catch (error) {
    console.error('Error in addReview:', error);
    
    const statusCode = error.message === 'Product not found' ? 404 : 500;
    
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to add review',
    });
  }
};



