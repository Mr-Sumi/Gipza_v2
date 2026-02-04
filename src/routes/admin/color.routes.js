const express = require('express');
const router = express.Router();
const colorControllers = require('../../controllers/admin/colorControllers');
const { validate } = require('../../middleware/validator');
const {
  getColorsValidation,
  getColorValidation,
  createColorValidation,
  updateColorValidation,
  deleteColorValidation,
} = require('../../validations/admin/color.validation');

/**
 * @route   GET /api/v1/admin/colors
 * @desc    Get all colors
 * @access  Admin/Manager
 */
router.get('/', validate(getColorsValidation), colorControllers.getColors);

/**
 * @route   GET /api/v1/admin/colors/:id
 * @desc    Get color by ID
 * @access  Admin/Manager
 */
router.get('/:id', validate(getColorValidation), colorControllers.getColor);

/**
 * @route   POST /api/v1/admin/colors
 * @desc    Create color
 * @access  Admin/Manager
 */
router.post('/', validate(createColorValidation), colorControllers.createColor);

/**
 * @route   PUT /api/v1/admin/colors/:id
 * @desc    Update color
 * @access  Admin/Manager
 */
router.put('/:id', validate(updateColorValidation), colorControllers.updateColor);

/**
 * @route   DELETE /api/v1/admin/colors/:id
 * @desc    Delete color (checks if products are using it)
 * @access  Admin/Manager
 */
router.delete('/:id', validate(deleteColorValidation), colorControllers.deleteColor);

module.exports = router;
