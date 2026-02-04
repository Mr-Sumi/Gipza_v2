const { uploadImageToS3, uploadVideoToS3 } = require('../config/s3Config');

/**
 * Upload image file to S3
 * @param {Buffer} fileBuffer
 * @param {string} originalName
 * @param {string} contentType
 * @returns {Promise<{ url: string, key: string, etag: string }>}
 */
const uploadImage = async (fileBuffer, originalName, contentType) => {
  const result = await uploadImageToS3(fileBuffer, originalName, contentType);
  return { url: result.url, key: result.key, etag: result.etag };
};

/**
 * Upload video file to S3
 * @param {Buffer} fileBuffer
 * @param {string} originalName
 * @param {string} contentType
 * @returns {Promise<{ url: string, key: string, etag: string }>}
 */
const uploadVideo = async (fileBuffer, originalName, contentType) => {
  const result = await uploadVideoToS3(fileBuffer, originalName, contentType);
  return { url: result.url, key: result.key, etag: result.etag };
};

module.exports = {
  uploadImage,
  uploadVideo,
};
