/**
 * Reuse existing validations from category.validation.js
 */
const {
  getCategoriesValidation,
  getCategoryValidation,
  createCategoryValidation,
  updateCategoryValidation,
  deleteCategoryValidation,
} = require('../category.validation');

module.exports = {
  getCategoriesValidation,
  getCategoryValidation,
  createCategoryValidation,
  updateCategoryValidation,
  deleteCategoryValidation,
};
