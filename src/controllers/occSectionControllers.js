const occSectionService = require('../services/occSectionService');

/**
 * Get all occasion sections
 * @route GET /api/v1/occ-sections
 */
exports.getAll = async (req, res) => {
  try {
    const { active } = req.query;
    const items = await occSectionService.getAllOccSections({ active });
    
    res.status(200).json({
      success: true,
      data: items,
      count: items.length,
    });
  } catch (error) {
    console.error('Error fetching occasion sections:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch occasion sections',
    });
  }
};

/**
 * Get occasion section by ID
 * @route GET /api/v1/occ-sections/:id
 */
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await occSectionService.getOccSectionById(id);
    
    res.status(200).json({
      success: true,
      data: item,
    });
  } catch (error) {
    console.error('Error fetching occasion section:', error);
    res.status(error.message === 'Occasion section not found' ? 404 : 500).json({
      success: false,
      message: error.message || 'Failed to fetch occasion section',
    });
  }
};

/**
 * Create a new occasion section
 * @route POST /api/v1/occ-sections
 * Body: JSON — name, description?, image?, image_key? (upload via POST /upload/image first)
 */
exports.create = async (req, res) => {
  try {
    const created = await occSectionService.createOccSection(req.body);

    res.status(201).json({
      success: true,
      data: created,
    });
  } catch (error) {
    console.error('Error creating occasion section:', error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Name must be unique',
      });
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create occasion section',
    });
  }
};

/**
 * Update an occasion section
 * @route PUT /api/v1/occ-sections/:id
 * Body: JSON — name?, description?, image?, image_key?, isActive?, order? (image + image_key from POST /upload/image to replace)
 */
exports.update = async (req, res) => {
  try {
    const { id } = req.params;

    const updated = await occSectionService.updateOccSection(id, req.body);

    res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error('Error updating occasion section:', error);
    res.status(error.message === 'Occasion section not found' ? 404 : 500).json({
      success: false,
      message: error.message || 'Failed to update occasion section',
    });
  }
};

/**
 * Delete an occasion section
 * @route DELETE /api/v1/occ-sections/:id
 */
exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    await occSectionService.deleteOccSection(id);

    res.status(200).json({
      success: true,
      message: 'Occasion section deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting occasion section:', error);
    res.status(error.message === 'Occasion section not found' ? 404 : 500).json({
      success: false,
      message: error.message || 'Failed to delete occasion section',
    });
  }
};
