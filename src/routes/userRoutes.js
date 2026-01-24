const express = require('express');
const router = express.Router();
const userControllers = require('../controllers/userControllers');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validator');
const {
  updateProfileValidation,
  addAddressValidation,
  updateAddressValidation,
  removeAddressValidation,
  addToWishlistValidation,
  removeFromWishlistValidation,
} = require('../validations/user.validation');


router.use(authenticate);

router.get('/profile', userControllers.getProfile);
router.put('/profile', validate(updateProfileValidation), userControllers.updateProfile);

router.get('/address', userControllers.getAllAddresses);
router.post('/address', validate(addAddressValidation), userControllers.addAddress);
router.put('/address/:addressId', validate(updateAddressValidation), userControllers.updateAddress);
router.delete('/address/:addressId', validate(removeAddressValidation), userControllers.removeAddress);

router.post('/wishlist/:productId', validate(addToWishlistValidation), userControllers.addToWishlist);
router.delete('/wishlist/:productId', validate(removeFromWishlistValidation), userControllers.removeFromWishlist);

module.exports = router;