const categoryService = require('../services/categoryService');

/**
 * Get all categories
 * GET /api/v1/categories
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
    console.error('Error in getCategories:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch categories',
    });
  }
};

/**
 * Get single category by ID
 * GET /api/v1/categories/:id
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
    console.error('Error in getCategory:', error);
    
    const statusCode = error.message === 'Category not found' ? 404 : 500;
    
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to fetch category',
    });
  }
};


