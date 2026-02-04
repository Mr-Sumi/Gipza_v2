const Banner = require('../models/Banner');

const BANNER_TYPE_ENUM = ['banner', 'ai-cta'];

/**
 * Get banners with optional filters (public or admin list)
 * @param {Object} options - { active?: boolean, type?: string, sort?: string }
 * @returns {Promise<Array>}
 */
const getBanners = async (options = {}) => {
  const { active, type, sort = 'sortOrder' } = options;

  const filter = {};
  if (active !== undefined) filter.active = active;
  if (type && BANNER_TYPE_ENUM.includes(type)) filter.type = type;

  const sortField = sort.startsWith('-') ? sort.slice(1) : sort;
  const sortOrder = sort.startsWith('-') ? -1 : 1;
  const sortObj = { [sortField]: sortOrder, createdAt: -1 };

  const banners = await Banner.find(filter)
    .sort(sortObj)
    .select('-__v')
    .lean();

  return banners;
};

/**
 * Get a single banner by ID
 * @param {string} bannerId - MongoDB ObjectId
 * @returns {Promise<Object>}
 */
const getBannerById = async (bannerId) => {
  const banner = await Banner.findById(bannerId).select('-__v').lean();

  if (!banner) {
    throw new Error('Banner not found');
  }

  return banner;
};

module.exports = {
  getBanners,
  getBannerById,
  BANNER_TYPE_ENUM,
};
