const express = require('express');
const router = express.Router();
const bannerControllers = require('../../controllers/admin/bannerControllers');
const { validate } = require('../../middleware/validator');
const {
  getBannersValidation,
  getBannerByIdValidation,
  createBannerValidation,
  updateBannerValidation,
  deleteBannerValidation,
} = require('../../validations/admin/banner.validation');

/**
 * @route   GET /api/v1/admin/banners
 * @desc    List banners (optional: ?active=true&type=banner&sort=sortOrder)
 * @access  Admin
 */
router.get('/', validate(getBannersValidation), bannerControllers.getBanners);

/**
 * @route   GET /api/v1/admin/banners/:id
 * @desc    Get banner by ID
 * @access  Admin
 */
router.get('/:id', validate(getBannerByIdValidation), bannerControllers.getBannerById);

/**
 * @route   POST /api/v1/admin/banners
 * @desc    Create banner. Upload image first via POST /upload/image, then send { name, type, image, image_key, ... } in JSON body.
 * @access  Admin
 */
router.post('/', validate(createBannerValidation), bannerControllers.createBanner);

/**
 * @route   PUT /api/v1/admin/banners/:id
 * @desc    Update banner. Send image + image_key together to replace image (from POST /upload/image).
 * @access  Admin
 */
router.put('/:id', validate(updateBannerValidation), bannerControllers.updateBanner);

/**
 * @route   DELETE /api/v1/admin/banners/:id
 * @desc    Delete banner and remove image from S3
 * @access  Admin
 */
router.delete('/:id', validate(deleteBannerValidation), bannerControllers.deleteBanner);

module.exports = router;
