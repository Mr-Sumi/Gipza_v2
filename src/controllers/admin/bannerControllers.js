const bannerService = require('../../services/admin/bannerService');

/**
 * Get all banners (Admin)
 * GET /api/v1/admin/banners
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
    console.error('Admin get banners failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch banners',
    });
  }
};

/**
 * Get banner by ID (Admin)
 * GET /api/v1/admin/banners/:id
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
    console.error('Admin get banner failed:', error);

    const statusCode = error.message === 'Banner not found' ? 404 : 500;

    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to fetch banner',
    });
  }
};

/**
 * Create banner (Admin)
 * POST /api/v1/admin/banners
 * Body: JSON — name, type?, active?, sortOrder?, image (required), image_key (required).
 * Upload image first via POST /upload/image, then send returned url and key here.
 */
exports.createBanner = async (req, res) => {
  try {
    const payload = req.body || {};

    const banner = await bannerService.createBanner(payload);

    return res.status(201).json({
      success: true,
      message: 'Banner created successfully',
      data: banner,
    });
  } catch (error) {
    console.error('Admin create banner failed:', error);

    let statusCode = 500;
    if (
      error.message?.includes('image') ||
      error.message?.includes('image_key') ||
      error.message === 'Banner image is required'
    ) {
      statusCode = 400;
    }

    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to create banner',
    });
  }
};

/**
 * Update banner (Admin)
 * PUT /api/v1/admin/banners/:id
 * Body: JSON — name?, type?, active?, sortOrder?, image?, image_key? (both image and image_key together to replace).
 */
exports.updateBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const payload = req.body || {};

    const hasUpdates = Object.keys(payload).some(
      (k) => payload[k] !== undefined && payload[k] !== ''
    );
    if (!hasUpdates) {
      return res.status(400).json({
        success: false,
        message: 'No updates provided. Send at least one of: name, type, active, sortOrder, or image + image_key.',
      });
    }

    const banner = await bannerService.updateBanner(id, payload);

    return res.status(200).json({
      success: true,
      message: 'Banner updated successfully',
      data: banner,
    });
  } catch (error) {
    console.error('Admin update banner failed:', error);

    let statusCode = 500;
    if (error.message === 'Banner not found') statusCode = 404;
    if (error.message?.includes('image') || error.message?.includes('image_key')) statusCode = 400;

    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to update banner',
    });
  }
};

/**
 * Delete banner (Admin)
 * DELETE /api/v1/admin/banners/:id
 */
exports.deleteBanner = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await bannerService.deleteBanner(id);

    return res.status(200).json({
      success: true,
      message: result.message,
      data: result.deletedBanner,
    });
  } catch (error) {
    console.error('Admin delete banner failed:', error);

    const statusCode = error.message === 'Banner not found' ? 404 : 500;

    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to delete banner',
    });
  }
};
