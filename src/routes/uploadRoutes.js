const express = require('express');
const router = express.Router();
const multer = require('multer');
const { validate } = require('../middleware/validator');
const { authenticate, authorize } = require('../middleware/auth');
const uploadControllers = require('../controllers/uploadControllers');
const { uploadImageValidation, uploadVideoValidation } = require('../validations/upload.validation');

const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, message: 'File too large. Check size limits (image: 10MB, video: 100MB).' });
    }
    return res.status(400).json({ success: false, message: err.message || 'File upload error' });
  }
  if (err) {
    return res.status(400).json({ success: false, message: err.message || 'Invalid file' });
  }
  next();
};

const storage = multer.memoryStorage();

const imageUpload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (e.g. image/jpeg, image/png)'), false);
    }
  },
});

const videoUpload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed (e.g. video/mp4)'), false);
    }
  },
});

router.use(authenticate);
router.use(authorize(['admin']));

/**
 * @route   POST /api/v1/upload/image
 * @desc    Upload single image to S3 (multipart field: image)
 * @access  Admin, Manager
 */
router.post(
  '/image',
  imageUpload.single('image'),
  handleMulterError,
  validate(uploadImageValidation),
  uploadControllers.uploadImage
);

/**
 * @route   POST /api/v1/upload/video
 * @desc    Upload single video to S3 (multipart field: video)
 * @access  Admin, Manager
 */
router.post(
  '/video',
  videoUpload.single('video'),
  handleMulterError,
  validate(uploadVideoValidation),
  uploadControllers.uploadVideo
);

module.exports = router;
