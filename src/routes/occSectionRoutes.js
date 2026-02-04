const express = require('express');
const router = express.Router();
const occSectionControllers = require('../controllers/occSectionControllers');
const { validate } = require('../middleware/validator');
const { authenticate, authorize } = require('../middleware/auth');
const {
  getAllOccSectionsValidation,
  getOccSectionByIdValidation,
  createOccSectionValidation,
  updateOccSectionValidation,
  deleteOccSectionValidation,
} = require('../validations/occSection.validation');

// All routes require admin authentication
router.use(authenticate);
router.use(authorize(['admin']));

/**
 * @route   GET /api/v1/occ-sections
 * @desc    Get all occasion sections
 * @access  Admin
 */
router.get('/', validate(getAllOccSectionsValidation), occSectionControllers.getAll);

/**
 * @route   GET /api/v1/occ-sections/:id
 * @desc    Get occasion section by ID
 * @access  Admin
 */
router.get('/:id', validate(getOccSectionByIdValidation), occSectionControllers.getById);

/**
 * @route   POST /api/v1/occ-sections
 * @desc    Create occasion section. Upload image via POST /upload/image first, then send { name, description?, image, image_key?, ... } in JSON body.
 * @access  Admin
 */
router.post('/', validate(createOccSectionValidation), occSectionControllers.create);

/**
 * @route   PUT /api/v1/occ-sections/:id
 * @desc    Update occasion section. Send image + image_key (from POST /upload/image) to replace image.
 * @access  Admin
 */
router.put('/:id', validate(updateOccSectionValidation), occSectionControllers.update);

/**
 * @route   DELETE /api/v1/occ-sections/:id
 * @desc    Delete occasion section and remove image from S3 if image_key exists
 * @access  Admin
 */
router.delete('/:id', validate(deleteOccSectionValidation), occSectionControllers.remove);

module.exports = router;
