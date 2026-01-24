const express = require('express');
const router = express.Router();
const colorControllers = require('../controllers/colorControllers');
const { validate } = require('../middleware/validator');
const {
  getColorsValidation,
  getColorValidation,
} = require('../validations/color.validation');

// Public routes
router.get('/', validate(getColorsValidation), colorControllers.getColors);
router.get('/:id', validate(getColorValidation), colorControllers.getColor);

// Note: Admin routes have been moved to /api/v1/admin/colors

module.exports = router;

