const userService = require('../../services/admin/userService');

/**
 * Get all users with pagination
 * GET /api/v1/admin/users
 */
exports.getAllUsers = async (req, res) => {
  try {
    const { page, limit, role, search } = req.query;

    const result = await userService.getAllUsers({
      page,
      limit,
      role,
      search,
    });

    return res.status(200).json({
      success: true,
      data: result.users,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error('Error in getAllUsers:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch users',
    });
  }
};

/**
 * Get user by ID
 * GET /api/v1/admin/users/:id
 */
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await userService.getUserById(id);

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Error in getUserById:', error);
    if (error.message === 'User not found' || error.message === 'Invalid user ID format') {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch user',
    });
  }
};

/**
 * Update user
 * PUT /api/v1/admin/users/:id
 */
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const user = await userService.updateUser(id, updates);

    return res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: user,
    });
  } catch (error) {
    console.error('Error in updateUser:', error);
    if (error.message === 'User not found' || error.message === 'Invalid user ID format') {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    if (error.message.includes('Password')) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to update user',
    });
  }
};

/**
 * Delete user
 * DELETE /api/v1/admin/users/:id
 */
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await userService.deleteUser(id);

    return res.status(200).json({
      success: true,
      message: result.message,
      data: result.deletedUser,
    });
  } catch (error) {
    console.error('Error in deleteUser:', error);
    if (error.message === 'User not found' || error.message === 'Invalid user ID format') {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    if (error.message.includes('Cannot delete user')) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete user',
    });
  }
};

/**
 * Search users
 * GET /api/v1/admin/users/search
 */
exports.searchUsers = async (req, res) => {
  try {
    const { q, limit } = req.query;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required',
      });
    }

    const result = await userService.searchUsers(q, limit);

    return res.status(200).json({
      success: true,
      data: result.users,
      count: result.count,
      query: result.query,
    });
  } catch (error) {
    console.error('Error in searchUsers:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to search users',
    });
  }
};

