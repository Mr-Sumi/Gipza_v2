const productService = require('../../services/admin/productService');

/**
 * List all products with enhanced filters (Admin)
 * GET /api/v1/admin/products
 */
exports.listProducts = async (req, res) => {
  try {
    const result = await productService.listProducts(req.query);

    return res.status(200).json({
      success: true,
      products: result.products,
      pagination: result.pagination,
      filters_applied: result.filters_applied,
    });
  } catch (error) {
    console.error('Admin list products failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      error: error.message,
    });
  }
};

/**
 * Get product details with full information (Admin)
 * GET /api/v1/admin/products/:id
 */
exports.getProductDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await productService.getProductDetails(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error('Admin get product details failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch product details',
      error: error.message,
    });
  }
};

/**
 * Create product (Admin)
 * POST /api/v1/admin/products
 */
exports.createProduct = async (req, res) => {
  try {
    const productData = req.body;

    const product = await productService.createProduct(productData);

    return res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product,
    });
  } catch (error) {
    console.error('Admin create product failed:', error);

    let statusCode = 500;
    if (error.message.includes('already exists')) {
      statusCode = 409;
    } else if (error.message.includes('required') || error.message.includes('Invalid')) {
      statusCode = 400;
    }

    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to create product',
    });
  }
};

/**
 * Update product (Admin)
 * PUT /api/v1/admin/products/:id
 */
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const product = await productService.updateProduct(id, updateData);

    return res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: product,
    });
  } catch (error) {
    console.error('Admin update product failed:', error);

    const statusCode = error.message === 'Product not found' ? 404 : 500;

    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to update product',
    });
  }
};

/**
 * Delete product (Admin)
 * DELETE /api/v1/admin/products/:id
 */
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    await productService.deleteProduct(id);

    return res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    console.error('Admin delete product failed:', error);

    const statusCode = error.message === 'Product not found' ? 404 : 500;

    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to delete product',
    });
  }
};

/**
 * Update product status (Admin)
 * PATCH /api/v1/admin/products/:id/status
 */
exports.updateProductStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const product = await productService.updateProductStatus(id, status);

    return res.status(200).json({
      success: true,
      message: 'Product status updated successfully',
      data: product,
    });
  } catch (error) {
    console.error('Admin update product status failed:', error);

    const statusCode = error.message === 'Product not found' ? 404 : 500;

    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to update product status',
    });
  }
};

/**
 * Update product stock (Admin)
 * PATCH /api/v1/admin/products/:id/stock
 */
exports.updateProductStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { stock } = req.body;

    const product = await productService.updateProductStock(id, stock);

    return res.status(200).json({
      success: true,
      message: 'Product stock updated successfully',
      data: product,
    });
  } catch (error) {
    console.error('Admin update product stock failed:', error);

    const statusCode = error.message === 'Product not found' ? 404 : 500;

    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to update product stock',
    });
  }
};

/**
 * Duplicate product (Admin)
 * POST /api/v1/admin/products/:id/duplicate
 */
exports.duplicateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const duplicateData = req.body;

    const product = await productService.duplicateProduct(id, duplicateData);

    return res.status(201).json({
      success: true,
      message: 'Product duplicated successfully',
      data: product,
    });
  } catch (error) {
    console.error('Admin duplicate product failed:', error);

    const statusCode = error.message === 'Product not found' ? 404 : 500;

    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to duplicate product',
    });
  }
};

/**
 * Add video to product (Admin)
 * POST /api/v1/admin/products/:id/videos
 */
exports.addVideoToProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const videoData = req.body;

    const product = await productService.addVideoToProduct(id, videoData);

    return res.status(200).json({
      success: true,
      message: 'Video added to product successfully',
      data: product,
    });
  } catch (error) {
    console.error('Admin add video to product failed:', error);

    const statusCode = error.message === 'Product not found' ? 404 : 500;

    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to add video to product',
    });
  }
};

/**
 * Update product video (Admin)
 * PUT /api/v1/admin/products/:id/videos/:videoKey
 */
exports.updateProductVideo = async (req, res) => {
  try {
    const { id, videoKey } = req.params;
    const updateData = req.body;

    const product = await productService.updateProductVideo(id, videoKey, updateData);

    return res.status(200).json({
      success: true,
      message: 'Product video updated successfully',
      data: product,
    });
  } catch (error) {
    console.error('Admin update product video failed:', error);

    const statusCode = error.message === 'Product not found' || error.message.includes('video') ? 404 : 500;

    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to update product video',
    });
  }
};

/**
 * Remove video from product (Admin)
 * DELETE /api/v1/admin/products/:id/videos/:videoKey
 */
exports.removeVideoFromProduct = async (req, res) => {
  try {
    const { id, videoKey } = req.params;

    const product = await productService.removeVideoFromProduct(id, videoKey);

    return res.status(200).json({
      success: true,
      message: 'Video removed from product successfully',
      data: product,
    });
  } catch (error) {
    console.error('Admin remove video from product failed:', error);

    const statusCode = error.message === 'Product not found' || error.message.includes('video') ? 404 : 500;

    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to remove video from product',
    });
  }
};

/**
 * Save product lists (Admin)
 * POST /api/v1/admin/products/lists
 */
exports.saveProductLists = async (req, res) => {
  try {
    const listData = req.body;
    const userId = req.user?.id || req.user?._id;

    const results = await productService.saveProductLists(listData, userId);

    return res.status(200).json({
      success: true,
      message: 'Product lists saved successfully',
      data: results,
    });
  } catch (error) {
    console.error('Admin save product lists failed:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to save product lists',
    });
  }
};
