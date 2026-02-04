/**
 * Reuse existing validations from color.validation.js
 */
const {
  getColorsValidation,
  getColorValidation,
  createColorValidation,
  updateColorValidation,
  deleteColorValidation,
} = require('../color.validation');

module.exports = {
  getColorsValidation,
  getColorValidation,
  createColorValidation,
  updateColorValidation,
  deleteColorValidation,
};
