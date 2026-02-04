const express = require('express');
const router = express.Router();
const userControllers = require('../../controllers/admin/userControllers');
const { validate } = require('../../middleware/validator');
const {
  getAllUsersValidation,
  getUserByIdValidation,
  updateUserValidation,
  deleteUserValidation,
  searchUsersValidation,
} = require('../../validations/admin/user.validation');

// User management routes
router.get('/', validate(getAllUsersValidation), userControllers.getAllUsers);
router.get('/search', validate(searchUsersValidation), userControllers.searchUsers);
router.get('/:id', validate(getUserByIdValidation), userControllers.getUserById);
router.put('/:id', validate(updateUserValidation), userControllers.updateUser);
router.delete('/:id', validate(deleteUserValidation), userControllers.deleteUser);

module.exports = router;

