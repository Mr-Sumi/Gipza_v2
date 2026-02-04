const express = require('express');
const router = express.Router();
const categoryControllers = require('../../controllers/admin/categoryControllers');
const { validate } = require('../../middleware/validator');
const {
  getCategoriesValidation,
  getCategoryValidation,
  createCategoryValidation,
  updateCategoryValidation,
  deleteCategoryValidation,
} = require('../../validations/admin/category.validation');

/**
 * @route   GET /api/v1/admin/categories
 * @desc    Get all categories
 * @access  Admin/Manager
 */
router.get('/', validate(getCategoriesValidation), categoryControllers.getCategories);

/**
 * @route   GET /api/v1/admin/categories/:id
 * @desc    Get category by ID
 * @access  Admin/Manager
 */
router.get('/:id', validate(getCategoryValidation), categoryControllers.getCategory);

/**
 * @route   POST /api/v1/admin/categories
 * @desc    Create category
 * @access  Admin/Manager
 */
router.post('/', validate(createCategoryValidation), categoryControllers.createCategory);

/**
 * @route   PUT /api/v1/admin/categories/:id
 * @desc    Update category
 * @access  Admin/Manager
 */
router.put('/:id', validate(updateCategoryValidation), categoryControllers.updateCategory);

/**
 * @route   DELETE /api/v1/admin/categories/:id
 * @desc    Delete category (checks if products are using it)
 * @access  Admin/Manager
 */
router.delete('/:id', validate(deleteCategoryValidation), categoryControllers.deleteCategory);

module.exports = router;
