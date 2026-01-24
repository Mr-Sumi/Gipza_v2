const Category = require('../models/Category');
const Product = require('../models/Product');

/**
 * Get all categories
 * @param {Object} options - Query options (search, sort)
 * @returns {Promise<Array>} Categories array
 */
const getCategories = async (options = {}) => {
  const { search, sort = 'name' } = options;
  
  let query = {};
  
  if (search) {
    query.name = { $regex: search, $options: 'i' };
  }
  
  const sortOrder = sort.startsWith('-') 
    ? { [sort.substring(1)]: -1 } 
    : { [sort]: 1 };
  
  const categories = await Category.find(query)
    .sort(sortOrder)
    .select('-__v')
    .lean();
  
  return categories;
};

/**
 * Get single category by ID
 * @param {string} categoryId - Category ID
 * @returns {Promise<Object>} Category object
 */
const getCategoryById = async (categoryId) => {
  const category = await Category.findById(categoryId).select('-__v').lean();
  
  if (!category) {
    throw new Error('Category not found');
  }
  
  return category;
};

/**
 * Create new category
 * @param {Object} categoryData - Category data (name, image)
 * @returns {Promise<Object>} Created category
 */
const createCategory = async (categoryData) => {
  const { name, image } = categoryData;
  
  const existingCategory = await Category.findOne({ 
    name: { $regex: new RegExp(`^${name}$`, 'i') } 
  }).select('_id name').lean();
  
  if (existingCategory) {
    throw new Error('Category with this name already exists');
  }
  
  const category = new Category({
    name: name.trim(),
    image: image || undefined, 
  });
  
  await category.save();
  
  return category;
};

/**
 * Update category
 * @param {string} categoryId - Category ID
 * @param {Object} updateData - Update data (name, image)
 * @returns {Promise<Object>} Updated category
 */
const updateCategory = async (categoryId, updateData) => {
  const category = await Category.findById(categoryId);
  
  if (!category) {
    throw new Error('Category not found');
  }
  
  if (updateData.name) {
    const existingCategory = await Category.findOne({
      _id: { $ne: categoryId },
      name: { $regex: new RegExp(`^${updateData.name}$`, 'i') }
    }).select('_id name').lean();
    
    if (existingCategory) {
      throw new Error('Category with this name already exists');
    }
    
    category.name = updateData.name.trim();
  }
  
  // Update image if provided
  if (updateData.image !== undefined) {
    category.image = updateData.image || category.image;
  }
  
  await category.save();
  
  return category;
};

/**
 * Delete category
 * @param {string} categoryId - Category ID
 * @returns {Promise<Object>} Deletion result
 */
const deleteCategory = async (categoryId) => {
  const category = await Category.findById(categoryId);
  
  if (!category) {
    throw new Error('Category not found');
  }
  
  // Check if any products are using this category
  const productsCount = await Product.countDocuments({ category: categoryId });
  
  if (productsCount > 0) {
    throw new Error(`Cannot delete category. ${productsCount} product(s) are using this category`);
  }
  
  await Category.findByIdAndDelete(categoryId);
  
  return {
    message: 'Category deleted successfully',
    deletedCategory: {
      id: category._id,
      name: category.name,
    },
  };
};

module.exports = {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};

