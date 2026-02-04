const colorService = require('../colorService');

/**
 * Reuse existing color service functions
 */
const getColors = async (options = {}) => {
  return await colorService.getColors(options);
};

const getColorById = async (colorId) => {
  return await colorService.getColorById(colorId);
};

const createColor = async (colorData) => {
  return await colorService.createColor(colorData);
};

const updateColor = async (colorId, updateData) => {
  return await colorService.updateColor(colorId, updateData);
};

const deleteColor = async (colorId) => {
  return await colorService.deleteColor(colorId);
};

module.exports = {
  getColors,
  getColorById,
  createColor,
  updateColor,
  deleteColor,
};
