const Color = require('../models/Color');
const Product = require('../models/Product');

/**
 * Get all colors
 * @param {Object} options - Query options (search, sort)
 * @returns {Promise<Array>} Colors array
 */
const getColors = async (options = {}) => {
  const { search, sort = 'name' } = options;
  
  let query = {};
  
  if (search) {
    query.name = { $regex: search, $options: 'i' };
  }
  
  const sortOrder = sort.startsWith('-') 
    ? { [sort.substring(1)]: -1 } 
    : { [sort]: 1 };
  
  const colors = await Color.find(query)
    .sort(sortOrder)
    .select('-__v')
    .lean();
  
  return colors;
};

/**
 * Get single color by ID
 * @param {string} colorId - Color ID
 * @returns {Promise<Object>} Color object
 */
const getColorById = async (colorId) => {
  const color = await Color.findById(colorId).select('-__v').lean();
  
  if (!color) {
    throw new Error('Color not found');
  }
  
  return color;
};

/**
 * Create new color
 * @param {Object} colorData - Color data (name, hex)
 * @returns {Promise<Object>} Created color
 */
const createColor = async (colorData) => {
  const { name, hex } = colorData;
  
  const existingColor = await Color.findOne({ 
    name: { $regex: new RegExp(`^${name}$`, 'i') } 
  }).select('_id name').lean();
  
  if (existingColor) {
    throw new Error('Color with this name already exists');
  }
  
  const color = new Color({
    name: name.trim(),
    hex: hex || '#FFFFFF',
  });
  
  await color.save();
  
  return color;
};

/**
 * Update color
 * @param {string} colorId - Color ID
 * @param {Object} updateData - Update data (name, hex)
 * @returns {Promise<Object>} Updated color
 */
const updateColor = async (colorId, updateData) => {
  const color = await Color.findById(colorId);
  
  if (!color) {
    throw new Error('Color not found');
  }
  
  if (updateData.name) {
    const existingColor = await Color.findOne({
      _id: { $ne: colorId },
      name: { $regex: new RegExp(`^${updateData.name}$`, 'i') }
    }).select('_id name').lean();
    
    if (existingColor) {
      throw new Error('Color with this name already exists');
    }
    
    color.name = updateData.name.trim();
  }
  
  if (updateData.hex !== undefined) {
    color.hex = updateData.hex;
  }
  
  await color.save();
  
  return color;
};

/**
 * Delete color
 * @param {string} colorId - Color ID
 * @returns {Promise<Object>} Deletion result
 */
const deleteColor = async (colorId) => {
  const color = await Color.findById(colorId);
  
  if (!color) {
    throw new Error('Color not found');
  }
  
  const productsCount = await Product.countDocuments({ 
    colors: colorId 
  });
  
  if (productsCount > 0) {
    throw new Error(`Cannot delete color. ${productsCount} product(s) are using this color`);
  }
  
  await Color.findByIdAndDelete(colorId);
  
  return {
    message: 'Color deleted successfully',
    deletedColor: {
      id: color._id,
      name: color.name,
    },
  };
};

module.exports = {
  getColors,
  getColorById,
  createColor,
  updateColor,
  deleteColor,
};

