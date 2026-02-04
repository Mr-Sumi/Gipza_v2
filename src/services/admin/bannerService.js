const Banner = require('../../models/Banner');
const { deleteFromS3 } = require('../../config/s3Config');

/**
 * Get banners (admin: can include inactive)
 */
const getBanners = async (options = {}) => {
  const bannerService = require('../bannerService');
  return bannerService.getBanners(options);
};

/**
 * Get banner by ID (admin)
 */
const getBannerById = async (bannerId) => {
  const bannerService = require('../bannerService');
  return bannerService.getBannerById(bannerId);
};

/**
 * Create banner using image URL and key from upload route
 * Client: POST /upload/image → get { url, key } → POST /admin/banners with { name, type, image, image_key, ... }
 * @param {Object} payload - { name, type, active?, sortOrder?, image, image_key }
 */
const createBanner = async (payload) => {
  const { name, type, active, sortOrder, image, image_key } = payload;

  if (!image || typeof image !== 'string' || !image.trim()) {
    throw new Error('Banner image URL is required. Upload image via POST /upload/image first.');
  }
  if (!image_key || typeof image_key !== 'string' || !image_key.trim()) {
    throw new Error('Banner image_key is required. Use the key returned from POST /upload/image.');
  }

  const banner = await Banner.create({
    name: (name || '').trim(),
    type: type || 'banner',
    image: image.trim(),
    image_key: image_key.trim(),
    active: active !== undefined ? active : true,
    sortOrder: sortOrder !== undefined ? Number(sortOrder) : 0,
  });

  return banner.toObject ? banner.toObject() : banner;
};

/**
 * Update banner; optionally replace image (send image + image_key from new upload, old key deleted from S3)
 * @param {string} bannerId - MongoDB ObjectId
 * @param {Object} payload - { name?, type?, active?, sortOrder?, image?, image_key? }
 */
const updateBanner = async (bannerId, payload) => {
  const banner = await Banner.findById(bannerId).lean();

  if (!banner) {
    throw new Error('Banner not found');
  }

  const updateFields = {};

  if (payload.name !== undefined) updateFields.name = String(payload.name).trim();
  if (payload.type !== undefined) updateFields.type = payload.type;
  if (payload.active !== undefined) updateFields.active = Boolean(payload.active);
  if (payload.sortOrder !== undefined) updateFields.sortOrder = Number(payload.sortOrder);

  if (payload.image !== undefined && payload.image_key !== undefined) {
    if (banner.image_key) {
      try {
        await deleteFromS3(banner.image_key);
      } catch (err) {
        console.error('Failed to delete old banner image from S3:', err);
      }
    }
    updateFields.image = String(payload.image).trim();
    updateFields.image_key = String(payload.image_key).trim();
  } else if (payload.image !== undefined || payload.image_key !== undefined) {
    throw new Error('When replacing image, both image and image_key must be provided (from POST /upload/image).');
  }

  const updated = await Banner.findByIdAndUpdate(
    bannerId,
    updateFields,
    { new: true, runValidators: true }
  )
    .select('-__v')
    .lean();

  return updated;
};

/**
 * Delete banner and remove image from S3 if image_key exists
 * @param {string} bannerId - MongoDB ObjectId
 */
const deleteBanner = async (bannerId) => {
  const banner = await Banner.findById(bannerId).lean();

  if (!banner) {
    throw new Error('Banner not found');
  }

  if (banner.image_key) {
    try {
      await deleteFromS3(banner.image_key);
    } catch (err) {
      console.error('Failed to delete banner image from S3:', err);
    }
  }

  await Banner.findByIdAndDelete(bannerId);

  return { deletedBanner: banner, message: 'Banner deleted successfully' };
};

module.exports = {
  getBanners,
  getBannerById,
  createBanner,
  updateBanner,
  deleteBanner,
};
