const uploadService = require('../services/uploadService');

/**
 * Upload single image to S3
 * POST /api/v1/upload/image
 * Body: multipart/form-data, field name: image
 */
exports.uploadImage = async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided. Use multipart field "image".',
      });
    }
    const { buffer, originalname, mimetype } = req.file;
    const result = await uploadService.uploadImage(buffer, originalname, mimetype);
    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      data: result,
    });
  } catch (error) {
    console.error('Upload image error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload image',
    });
  }
};

/**
 * Upload single video to S3
 * POST /api/v1/upload/video
 * Body: multipart/form-data, field name: video
 */
exports.uploadVideo = async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({
        success: false,
        message: 'No video file provided. Use multipart field "video".',
      });
    }
    const { buffer, originalname, mimetype } = req.file;
    const result = await uploadService.uploadVideo(buffer, originalname, mimetype);
    res.status(200).json({
      success: true,
      message: 'Video uploaded successfully',
      data: result,
    });
  } catch (error) {
    console.error('Upload video error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload video',
    });
  }
};
