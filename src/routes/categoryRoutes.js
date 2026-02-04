const express = require('express');
const router = express.Router();
const categoryControllers = require('../controllers/categoryControllers');
const { validate } = require('../middleware/validator');
const {
  getCategoriesValidation,
  getCategoryValidation,
} = require('../validations/category.validation');


router.get('/', validate(getCategoriesValidation), categoryControllers.getCategories);
router.get('/:id', validate(getCategoryValidation), categoryControllers.getCategory);

// Note: Admin routes have been moved to /api/v1/admin/categories

module.exports = router;

