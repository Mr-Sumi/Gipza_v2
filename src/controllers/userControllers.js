const userService = require('../services/userService');

/**
 * Get current user profile
 * GET /api/v1/users/profile
 */
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const profile = await userService.getProfile(userId);
    
    return res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    console.error('Error in getProfile:', error);
    
    const statusCode = error.message === 'User not found' ? 404 : 500;
    
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to get profile',
    });
  }
};

/**
 * Update user profile
 * PUT /api/v1/users/profile
 */
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const updateData = req.body;
    
    const updatedProfile = await userService.updateProfile(userId, updateData);
    
    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedProfile,
    });
  } catch (error) {
    console.error('Error in updateProfile:', error);
    
    const statusCode = error.message === 'User not found' ? 404 : 500;
    
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to update profile',
    });
  }
};

/**
 * Add address to user
 * POST /api/v1/users/address
 */
exports.addAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const addressData = req.body;
    
    const addresses = await userService.addAddress(userId, addressData);
    
    return res.status(201).json({
      success: true,
      message: 'Address added successfully',
      data: addresses,
    });
  } catch (error) {
    console.error('Error in addAddress:', error);
    
    const statusCode = error.message === 'User not found' ? 404 : 500;
    
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to add address',
    });
  }
};

/**
 * Update user address
 * PUT /api/v1/users/address/:addressId
 */
exports.updateAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { addressId } = req.params;
    const updateData = req.body;
    
    const updatedAddress = await userService.updateAddress(userId, addressId, updateData);
    
    return res.status(200).json({
      success: true,
      message: 'Address updated successfully',
      data: updatedAddress,
    });
  } catch (error) {
    console.error('Error in updateAddress:', error);
    
    let statusCode = 500;
    if (error.message === 'User not found' || error.message === 'Address not found') {
      statusCode = 404;
    }
    
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to update address',
    });
  }
};

/**
 * Remove address from user
 * DELETE /api/v1/users/address/:addressId
 */
exports.removeAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { addressId } = req.params;
    
    const addresses = await userService.removeAddress(userId, addressId);
    
    return res.status(200).json({
      success: true,
      message: 'Address removed successfully',
      data: addresses,
    });
  } catch (error) {
    console.error('Error in removeAddress:', error);
    
    let statusCode = 500;
    if (error.message === 'User not found' || error.message === 'Address not found') {
      statusCode = 404;
    }
    
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to remove address',
    });
  }
};

/**
 * Get all user addresses
 * GET /api/v1/users/address
 */
exports.getAllAddresses = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const addresses = await userService.getAllAddresses(userId);
    
    return res.status(200).json({
      success: true,
      data: addresses,
    });
  } catch (error) {
    console.error('Error in getAllAddresses:', error);
    
    const statusCode = error.message === 'User not found' ? 404 : 500;
    
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to get addresses',
    });
  }
};

/**
 * Add product to wishlist
 * POST /api/v1/users/wishlist/:productId
 */
exports.addToWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;
    
    const wishlist = await userService.addToWishlist(userId, productId);
    
    return res.status(200).json({
      success: true,
      message: 'Product added to wishlist successfully',
      data: wishlist,
    });
  } catch (error) {
    console.error('Error in addToWishlist:', error);
    
    let statusCode = 500;
    if (error.message === 'User not found' || error.message === 'Product not found') {
      statusCode = 404;
    } else if (error.message === 'Product already in wishlist') {
      statusCode = 409;
    }
    
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to add product to wishlist',
    });
  }
};

/**
 * Remove product from wishlist
 * DELETE /api/v1/users/wishlist/:productId
 */
exports.removeFromWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;
    
    const wishlist = await userService.removeFromWishlist(userId, productId);
    
    return res.status(200).json({
      success: true,
      message: 'Product removed from wishlist successfully',
      data: wishlist,
    });
  } catch (error) {
    console.error('Error in removeFromWishlist:', error);
    
    let statusCode = 500;
    if (error.message === 'User not found' || error.message === 'Product not found in wishlist') {
      statusCode = 404;
    }
    
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to remove product from wishlist',
    });
  }
};
