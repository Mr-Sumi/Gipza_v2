const express = require('express');
const router = express.Router();
const listControllers = require('../../controllers/listControllers');
const { validate } = require('../../middleware/validator');
const {
  saveListValidation,
  getListsValidation,
  getListByIdValidation,
  updateListValidation,
  deleteListValidation,
} = require('../../validations/admin/list.validation');

// Order: specific paths before :id
/**
 * @route   GET /api/v1/admin/lists/get-list
 * @desc    Get all lists with optional type filter
 * @access  Admin/Manager
 */
router.get('/get-list', validate(getListsValidation), listControllers.getLists);

/**
 * @route   POST /api/v1/admin/lists/list-store
 * @desc    Save a new list
 * @access  Admin/Manager
 */
router.post('/list-store', validate(saveListValidation), listControllers.saveList);

/**
 * @route   DELETE /api/v1/admin/lists/delete-list/:id
 * @desc    Delete a list (alternative path)
 * @access  Admin/Manager
 */
router.delete('/delete-list/:id', validate(deleteListValidation), listControllers.deleteList);

/**
 * @route   GET /api/v1/admin/lists/:id
 * @desc    Get a list by ID
 * @access  Admin/Manager
 */
router.get('/:id', validate(getListByIdValidation), listControllers.getListById);

/**
 * @route   PUT /api/v1/admin/lists/:id
 * @desc    Update a list
 * @access  Admin/Manager
 */
router.put('/:id', validate(updateListValidation), listControllers.updateList);

/**
 * @route   DELETE /api/v1/admin/lists/:id
 * @desc    Delete a list
 * @access  Admin/Manager
 */
router.delete('/:id', validate(deleteListValidation), listControllers.deleteList);

module.exports = router;
