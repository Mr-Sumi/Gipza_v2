const categoryService = require('../categoryService');

/**
 * Reuse existing category service functions
 */
const getCategories = async (options = {}) => {
  return await categoryService.getCategories(options);
};

const getCategoryById = async (categoryId) => {
  return await categoryService.getCategoryById(categoryId);
};

const createCategory = async (categoryData) => {
  return await categoryService.createCategory(categoryData);
};

const updateCategory = async (categoryId, updateData) => {
  return await categoryService.updateCategory(categoryId, updateData);
};

const deleteCategory = async (categoryId) => {
  return await categoryService.deleteCategory(categoryId);
};

module.exports = {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};
