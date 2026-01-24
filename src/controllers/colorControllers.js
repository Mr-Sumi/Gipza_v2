const colorService = require('../services/colorService');

/**
 * Get all colors
 * GET /api/v1/colors
 */
exports.getColors = async (req, res) => {
  try {
    const { search, sort } = req.query;
    
    const colors = await colorService.getColors({ search, sort });
    
    return res.status(200).json({
      success: true,
      count: colors.length,
      data: colors,
    });
  } catch (error) {
    console.error('Error in getColors:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch colors',
    });
  }
};

/**
 * Get single color by ID
 * GET /api/v1/colors/:id
 */
exports.getColor = async (req, res) => {
  try {
    const { id } = req.params;
    
    const color = await colorService.getColorById(id);
    
    return res.status(200).json({
      success: true,
      data: color,
    });
  } catch (error) {
    console.error('Error in getColor:', error);
    
    const statusCode = error.message === 'Color not found' ? 404 : 500;
    
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to fetch color',
    });
  }
};



