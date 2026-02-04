const bannerService = require('../services/bannerService');

/**
 * Get all banners (public)
 * GET /api/v1/banners
 */
exports.getBanners = async (req, res) => {
  try {
    const { active, type, sort } = req.query;

    const banners = await bannerService.getBanners({
      active,
      type: type || undefined,
      sort,
    });

    return res.status(200).json({
      success: true,
      count: banners.length,
      data: banners,
    });
  } catch (error) {
    console.error('Get banners failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch banners',
    });
  }
};

/**
 * Get banner by ID (public)
 * GET /api/v1/banners/:id
 */
exports.getBannerById = async (req, res) => {
  try {
    const { id } = req.params;

    const banner = await bannerService.getBannerById(id);

    return res.status(200).json({
      success: true,
      data: banner,
    });
  } catch (error) {
    console.error('Get banner failed:', error);

    const statusCode = error.message === 'Banner not found' ? 404 : 500;

    return res.status(statusCode).json({
      success: false,
      message: error.message === 'Banner not found' ? error.message : 'Failed to fetch banner',
    });
  }
};
