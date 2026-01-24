const User = require('../models/User');
const Product = require('../models/Product');

/**
 * Get user profile
 * @param {string} userId - User ID
 * @returns {Promise<Object>} User profile
 */
const getProfile = async (userId) => {
  const user = await User.findById(userId)
    .select('-password -otp -refreshToken')
    .populate('wishlist', 'name sellingPrice images status');
  
  if (!user) {
    throw new Error('User not found');
  }

  return {
    id: user._id,
    name: user.name || null,
    email: user.email || null,
    phoneNumber: user.phoneNumber,
    role: user.role || 'customer',
    gender: user.gender || null,
    dateOfBirth: user.dateOfBirth || null,
    addresses: user.addresses || [],
    wishlist: user.wishlist || [],
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

/**
 * Update user profile
 * @param {string} userId - User ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated user profile
 */
const updateProfile = async (userId, updateData) => {
  const user = await User.findById(userId);
  
  if (!user) {
    throw new Error('User not found');
  }

  // Update only provided fields
  if (updateData.name !== undefined) user.name = updateData.name;
  if (updateData.email !== undefined) user.email = updateData.email;
  if (updateData.phoneNumber !== undefined) user.phoneNumber = updateData.phoneNumber;
  if (updateData.gender !== undefined) user.gender = updateData.gender;
  if (updateData.dateOfBirth !== undefined) user.dateOfBirth = updateData.dateOfBirth;

  await user.save();

  return {
    id: user._id,
    name: user.name || null,
    email: user.email || null,
    phoneNumber: user.phoneNumber,
    role: user.role || 'customer',
    gender: user.gender || null,
    dateOfBirth: user.dateOfBirth || null,
    addresses: user.addresses || [],
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

/**
 * Add address to user
 * @param {string} userId - User ID
 * @param {Object} addressData - Address data
 * @returns {Promise<Array>} Updated addresses array
 */
const addAddress = async (userId, addressData) => {
  const user = await User.findById(userId);
  
  if (!user) {
    throw new Error('User not found');
  }

  user.addresses.push(addressData);
  await user.save();

  return user.addresses;
};

/**
 * Update user address
 * @param {string} userId - User ID
 * @param {string} addressId - Address ID
 * @param {Object} updateData - Address update data
 * @returns {Promise<Object>} Updated address
 */
const updateAddress = async (userId, addressId, updateData) => {
  const user = await User.findById(userId);
  
  if (!user) {
    throw new Error('User not found');
  }

  const addressIndex = user.addresses.findIndex(
    (addr) => addr._id.toString() === addressId
  );

  if (addressIndex === -1) {
    throw new Error('Address not found');
  }

  // Update address fields
  Object.keys(updateData).forEach((key) => {
    if (updateData[key] !== undefined) {
      user.addresses[addressIndex][key] = updateData[key];
    }
  });

  await user.save();

  return user.addresses[addressIndex];
};

/**
 * Remove address from user
 * @param {string} userId - User ID
 * @param {string} addressId - Address ID
 * @returns {Promise<Array>} Updated addresses array
 */
const removeAddress = async (userId, addressId) => {
  const user = await User.findById(userId);
  
  if (!user) {
    throw new Error('User not found');
  }

  const addressExists = user.addresses.some(
    (addr) => addr._id.toString() === addressId
  );

  if (!addressExists) {
    throw new Error('Address not found');
  }

  user.addresses = user.addresses.filter(
    (address) => address._id.toString() !== addressId
  );

  await user.save();

  return user.addresses;
};

/**
 * Get all user addresses
 * @param {string} userId - User ID
 * @returns {Promise<Array>} User addresses
 */
const getAllAddresses = async (userId) => {
  const user = await User.findById(userId).select('addresses').lean();
  
  if (!user) {
    throw new Error('User not found');
  }

  return user.addresses || [];
};

/**
 * Add product to wishlist
 * @param {string} userId - User ID
 * @param {string} productId - Product ID
 * @returns {Promise<Array>} Updated wishlist
 */
const addToWishlist = async (userId, productId) => {
  const user = await User.findById(userId);
  
  if (!user) {
    throw new Error('User not found');
  }

  // Check if product exists
  const product = await Product.findById(productId).select('_id name status').lean();
  if (!product) {
    throw new Error('Product not found');
  }

  // Check if product is already in wishlist
  if (user.wishlist.includes(productId)) {
    throw new Error('Product already in wishlist');
  }

  user.wishlist.push(productId);
  await user.save();

  // Populate wishlist with product details
  await user.populate('wishlist', 'name sellingPrice images status');
  
  return user.wishlist;
};

/**
 * Remove product from wishlist
 * @param {string} userId - User ID
 * @param {string} productId - Product ID
 * @returns {Promise<Array>} Updated wishlist
 */
const removeFromWishlist = async (userId, productId) => {
  const user = await User.findById(userId);
  
  if (!user) {
    throw new Error('User not found');
  }

  const productExists = user.wishlist.some(
    (id) => id.toString() === productId
  );

  if (!productExists) {
    throw new Error('Product not found in wishlist');
  }

  user.wishlist = user.wishlist.filter(
    (id) => id.toString() !== productId
  );

  await user.save();

  // Populate wishlist with product details
  await user.populate('wishlist', 'name sellingPrice images status');
  
  return user.wishlist;
};

module.exports = {
  getProfile,
  updateProfile,
  addAddress,
  updateAddress,
  removeAddress,
  getAllAddresses,
  addToWishlist,
  removeFromWishlist,
};

