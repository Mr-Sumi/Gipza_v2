const listService = require('../services/listService');

/**
 * Save a new list
 * @route POST /api/v1/lists/list-store
 */
exports.saveList = async (req, res) => {
  try {
    const userId = req.user?.id ?? req.user?._id ?? null;
    const list = await listService.saveList(req.body, userId);
    
    res.status(201).json({
      success: true,
      data: list,
    });
  } catch (error) {
    console.error('Error saving list:', error);
    res.status(error.message === 'List not found' ? 404 : 500).json({
      success: false,
      message: error.message || 'Failed to save list',
    });
  }
};

/**
 * Get all lists with optional type filter
 * @route GET /api/v1/lists/get-list
 */
exports.getLists = async (req, res) => {
  try {
    const { type } = req.query;
    const lists = await listService.getLists({ type });
    
    res.status(200).json({
      success: true,
      data: lists,
      count: lists.length,
    });
  } catch (error) {
    console.error('Error fetching lists:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch lists',
    });
  }
};

/**
 * Get a specific list by ID
 * @route GET /api/v1/lists/:id
 */
exports.getListById = async (req, res) => {
  try {
    const { id } = req.params;
    const list = await listService.getListById(id);
    
    res.status(200).json({
      success: true,
      data: list,
    });
  } catch (error) {
    console.error('Error fetching list:', error);
    res.status(error.message === 'List not found' ? 404 : 500).json({
      success: false,
      message: error.message || 'Failed to fetch list',
    });
  }
};

/**
 * Update a list
 * @route PUT /api/v1/lists/:id
 */
exports.updateList = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedList = await listService.updateList(id, req.body);
    
    res.status(200).json({
      success: true,
      data: updatedList,
    });
  } catch (error) {
    console.error('Error updating list:', error);
    res.status(error.message === 'List not found' ? 404 : 500).json({
      success: false,
      message: error.message || 'Failed to update list',
    });
  }
};

/**
 * Delete a list
 * @route DELETE /api/v1/lists/:id
 * @route DELETE /api/v1/lists/delete-list/:id
 */
exports.deleteList = async (req, res) => {
  try {
    const { id } = req.params;
    await listService.deleteList(id);
    
    res.status(200).json({
      success: true,
      message: 'List deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting list:', error);
    res.status(error.message === 'List not found' ? 404 : 500).json({
      success: false,
      message: error.message || 'Failed to delete list',
    });
  }
};
