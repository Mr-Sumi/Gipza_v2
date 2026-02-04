const express = require('express');
const router = express.Router();
const bannerControllers = require('../controllers/bannerControllers');
const { validate } = require('../middleware/validator');
const {
  getBannersValidation,
  getBannerByIdValidation,
} = require('../validations/banner.validation');

/**
 * @route   GET /api/v1/banners
 * @desc    List banners (optional: ?active=true&type=banner&sort=sortOrder)
 * @access  Public
 */
router.get('/', validate(getBannersValidation), bannerControllers.getBanners);

/**
 * @route   GET /api/v1/banners/:id
 * @desc    Get banner by ID
 * @access  Public
 */
router.get('/:id', validate(getBannerByIdValidation), bannerControllers.getBannerById);

module.exports = router;
