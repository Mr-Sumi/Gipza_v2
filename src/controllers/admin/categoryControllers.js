const categoryService = require('../../services/admin/categoryService');

/**
 * Get all categories (Admin)
 * GET /api/v1/admin/categories
 */
exports.getCategories = async (req, res) => {
  try {
    const { search, sort } = req.query;

    const categories = await categoryService.getCategories({ search, sort });

    return res.status(200).json({
      success: true,
      count: categories.length,
      data: categories,
    });
  } catch (error) {
    console.error('Admin get categories failed:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch categories',
    });
  }
};

/**
 * Get category by ID (Admin)
 * GET /api/v1/admin/categories/:id
 */
exports.getCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await categoryService.getCategoryById(id);

    return res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error('Admin get category failed:', error);

    const statusCode = error.message === 'Category not found' ? 404 : 500;

    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to fetch category',
    });
  }
};

/**
 * Create category (Admin)
 * POST /api/v1/admin/categories
 */
exports.createCategory = async (req, res) => {
  try {
    const categoryData = req.body;

    const category = await categoryService.createCategory(categoryData);

    return res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category,
    });
  } catch (error) {
    console.error('Admin create category failed:', error);

    let statusCode = 500;
    if (error.message === 'Category with this name already exists') {
      statusCode = 409;
    }

    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to create category',
    });
  }
};

/**
 * Update category (Admin)
 * PUT /api/v1/admin/categories/:id
 */
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const category = await categoryService.updateCategory(id, updateData);

    return res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: category,
    });
  } catch (error) {
    console.error('Admin update category failed:', error);

    let statusCode = 500;
    if (error.message === 'Category not found') {
      statusCode = 404;
    } else if (error.message === 'Category with this name already exists') {
      statusCode = 409;
    }

    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to update category',
    });
  }
};

/**
 * Delete category (Admin)
 * DELETE /api/v1/admin/categories/:id
 */
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await categoryService.deleteCategory(id);

    return res.status(200).json({
      success: true,
      message: result.message,
      data: result.deletedCategory,
    });
  } catch (error) {
    console.error('Admin delete category failed:', error);

    let statusCode = 500;
    if (error.message === 'Category not found') {
      statusCode = 404;
    } else if (error.message.includes('Cannot delete category')) {
      statusCode = 400;
    }

    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to delete category',
    });
  }
};
