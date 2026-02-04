const colorService = require('../../services/admin/colorService');

/**
 * Get all colors (Admin)
 * GET /api/v1/admin/colors
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
    console.error('Admin get colors failed:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch colors',
    });
  }
};

/**
 * Get color by ID (Admin)
 * GET /api/v1/admin/colors/:id
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
    console.error('Admin get color failed:', error);

    const statusCode = error.message === 'Color not found' ? 404 : 500;

    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to fetch color',
    });
  }
};

/**
 * Create color (Admin)
 * POST /api/v1/admin/colors
 */
exports.createColor = async (req, res) => {
  try {
    const colorData = req.body;

    const color = await colorService.createColor(colorData);

    return res.status(201).json({
      success: true,
      message: 'Color created successfully',
      data: color,
    });
  } catch (error) {
    console.error('Admin create color failed:', error);

    let statusCode = 500;
    if (error.message === 'Color with this name already exists') {
      statusCode = 409;
    }

    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to create color',
    });
  }
};

/**
 * Update color (Admin)
 * PUT /api/v1/admin/colors/:id
 */
exports.updateColor = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const color = await colorService.updateColor(id, updateData);

    return res.status(200).json({
      success: true,
      message: 'Color updated successfully',
      data: color,
    });
  } catch (error) {
    console.error('Admin update color failed:', error);

    let statusCode = 500;
    if (error.message === 'Color not found') {
      statusCode = 404;
    } else if (error.message === 'Color with this name already exists') {
      statusCode = 409;
    }

    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to update color',
    });
  }
};

/**
 * Delete color (Admin)
 * DELETE /api/v1/admin/colors/:id
 */
exports.deleteColor = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await colorService.deleteColor(id);

    return res.status(200).json({
      success: true,
      message: result.message,
      data: result.deletedColor,
    });
  } catch (error) {
    console.error('Admin delete color failed:', error);

    let statusCode = 500;
    if (error.message === 'Color not found') {
      statusCode = 404;
    } else if (error.message.includes('Cannot delete color')) {
      statusCode = 400;
    }

    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to delete color',
    });
  }
};
