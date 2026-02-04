const mongoose = require('mongoose');
const User = require('../../models/User');
const NewOrder = require('../../models/NewOrder');

/**
 * Get all users with pagination
 * @param {Object} options - Pagination and filter options
 * @returns {Promise<Object>} Users list with pagination info
 */
const getAllUsers = async (options = {}) => {
  try {
    const page = parseInt(options.page) || 1;
    const limit = parseInt(options.limit) || 20;
    const skip = (page - 1) * limit;
    const { role, search } = options;

    // Build filter
    const filter = {};
    if (role) {
      filter.role = role;
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } },
      ];
    }

    // Get total count
    const totalUsers = await User.countDocuments(filter);

    // Fetch paginated users (exclude password)
    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Calculate pagination info
    const totalPages = Math.ceil(totalUsers / limit);
    const hasMore = page < totalPages;
    const hasPrev = page > 1;

    return {
      users,
      pagination: {
        current_page: page,
        total_pages: totalPages,
        total_users: totalUsers,
        limit,
        has_next_page: hasMore,
        has_prev_page: hasPrev,
      },
    };
  } catch (error) {
    console.error('Error getting all users:', error);
    throw error;
  }
};

/**
 * Get user by ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} User details
 */
const getUserById = async (userId) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID format');
    }

    const user = await User.findById(userId).select('-password').lean();

    if (!user) {
      throw new Error('User not found');
    }

    // Get user's order statistics
    const orderStats = await NewOrder.aggregate([
      {
        $match: {
          user_id: userId.toString(),
          is_deleted: false,
        },
      },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalSpent: {
            $sum: {
              $cond: [
                { $eq: ['$payment_status', 'paid'] },
                { $ifNull: ['$final_order_amount', 0] },
                0,
              ],
            },
          },
          pendingOrders: {
            $sum: {
              $cond: [{ $eq: ['$status', 'payment_pending'] }, 1, 0],
            },
          },
          deliveredOrders: {
            $sum: {
              $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0],
            },
          },
        },
      },
    ]);

    const stats = orderStats[0] || {
      totalOrders: 0,
      totalSpent: 0,
      pendingOrders: 0,
      deliveredOrders: 0,
    };

    return {
      ...user,
      orderStats: {
        totalOrders: stats.totalOrders,
        totalSpent: Math.round(stats.totalSpent * 100) / 100,
        pendingOrders: stats.pendingOrders,
        deliveredOrders: stats.deliveredOrders,
      },
    };
  } catch (error) {
    console.error('Error getting user by ID:', error);
    throw error;
  }
};

/**
 * Update user
 * @param {string} userId - User ID
 * @param {Object} updates - User fields to update
 * @returns {Promise<Object>} Updated user
 */
const updateUser = async (userId, updates) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID format');
    }

    // Allowed fields for update
    const allowedFields = [
      'name',
      'email',
      'phoneNumber',
      'role',
      'gender',
      'dateOfBirth',
      'addresses',
      'fcmToken',
    ];

    // Filter updates to only include allowed fields
    const filteredUpdates = {};
    Object.keys(updates).forEach((key) => {
      if (allowedFields.includes(key)) {
        filteredUpdates[key] = updates[key];
      }
    });

    // Don't allow updating password through this endpoint
    if (updates.password) {
      throw new Error('Password cannot be updated through this endpoint');
    }

    const user = await User.findByIdAndUpdate(
      userId,
      filteredUpdates,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

/**
 * Delete user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Deletion result
 */
const deleteUser = async (userId) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID format');
    }

    // Check if user has any orders
    const orderCount = await NewOrder.countDocuments({
      user_id: userId.toString(),
      is_deleted: false,
    });

    if (orderCount > 0) {
      throw new Error(
        `Cannot delete user with ${orderCount} existing order(s). Please handle orders first.`
      );
    }

    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      throw new Error('User not found');
    }

    return {
      message: 'User deleted successfully',
      deletedUser: {
        id: user._id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
      },
    };
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

/**
 * Search users
 * @param {string} query - Search term
 * @param {number} limit - Maximum results
 * @returns {Promise<Array>} Matching users
 */
const searchUsers = async (query, limit = 20) => {
  try {
    if (!query || query.trim().length === 0) {
      throw new Error('Search query is required');
    }

    const searchTerm = query.trim();
    const searchLimit = parseInt(limit) || 20;

    // Build search query - search in name, email, phoneNumber, or _id
    const searchQuery = {
      $or: [
        { name: { $regex: searchTerm, $options: 'i' } },
        { email: { $regex: searchTerm, $options: 'i' } },
        { phoneNumber: { $regex: searchTerm, $options: 'i' } },
        ...(mongoose.Types.ObjectId.isValid(searchTerm)
          ? [{ _id: new mongoose.Types.ObjectId(searchTerm) }]
          : []),
      ],
    };

    const users = await User.find(searchQuery)
      .select('name email phoneNumber role _id createdAt')
      .limit(searchLimit)
      .sort({ createdAt: -1 })
      .lean();

    return {
      users,
      count: users.length,
      query: searchTerm,
    };
  } catch (error) {
    console.error('Error searching users:', error);
    throw error;
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  searchUsers,
};

