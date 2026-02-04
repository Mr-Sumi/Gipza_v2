const couponService = require('../../services/admin/couponService');

/**
 * Create coupon (Admin)
 * POST /api/v1/admin/coupons
 */
exports.createCoupon = async (req, res) => {
  try {
    const couponData = req.body;

    const coupon = await couponService.createCoupon(couponData);

    return res.status(201).json({
      success: true,
      message: 'Coupon created successfully',
      data: coupon,
    });
  } catch (error) {
    console.error('Admin create coupon failed:', error);

    let statusCode = 500;
    if (error.message.includes('already exists') || error.message.includes('must be')) {
      statusCode = 400;
    }

    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to create coupon',
    });
  }
};

/**
 * Get all coupons (Admin)
 * GET /api/v1/admin/coupons
 */
exports.getAllCoupons = async (req, res) => {
  try {
    const filters = {
      page: req.query.page,
      limit: req.query.limit,
      isActive: req.query.isActive,
    };

    const result = await couponService.getAllCoupons(filters);

    return res.status(200).json({
      success: true,
      message: 'Coupons fetched successfully',
      ...result,
    });
  } catch (error) {
    console.error('Admin get all coupons failed:', error);

    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch coupons',
    });
  }
};

/**
 * Get coupon by ID (Admin)
 * GET /api/v1/admin/coupons/:id
 */
exports.getCouponById = async (req, res) => {
  try {
    const { id } = req.params;

    const coupon = await couponService.getCouponById(id);

    return res.status(200).json({
      success: true,
      message: 'Coupon fetched successfully',
      data: coupon,
    });
  } catch (error) {
    console.error('Admin get coupon by ID failed:', error);

    let statusCode = 404;
    if (!error.message.includes('not found')) {
      statusCode = 500;
    }

    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to fetch coupon',
    });
  }
};

/**
 * Update coupon (Admin)
 * PUT /api/v1/admin/coupons/:id
 */
exports.updateCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const coupon = await couponService.updateCoupon(id, updateData);

    return res.status(200).json({
      success: true,
      message: 'Coupon updated successfully',
      data: coupon,
    });
  } catch (error) {
    console.error('Admin update coupon failed:', error);

    let statusCode = 500;
    if (error.message.includes('not found')) {
      statusCode = 404;
    } else if (error.message.includes('already exists') || error.message.includes('must be')) {
      statusCode = 400;
    }

    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to update coupon',
    });
  }
};

/**
 * Delete coupon (Admin)
 * DELETE /api/v1/admin/coupons/:id
 */
exports.deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;

    const coupon = await couponService.deleteCoupon(id);

    return res.status(200).json({
      success: true,
      message: 'Coupon deleted successfully',
      data: coupon,
    });
  } catch (error) {
    console.error('Admin delete coupon failed:', error);

    let statusCode = 404;
    if (!error.message.includes('not found')) {
      statusCode = 500;
    }

    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to delete coupon',
    });
  }
};

/**
 * Activate coupon (Admin)
 * PUT /api/v1/admin/coupons/:id/activate
 */
exports.activateCoupon = async (req, res) => {
  try {
    const { id } = req.params;

    const coupon = await couponService.activateCoupon(id);

    return res.status(200).json({
      success: true,
      message: 'Coupon activated successfully',
      data: coupon,
    });
  } catch (error) {
    console.error('Admin activate coupon failed:', error);

    const statusCode = error.message === 'Coupon not found' ? 404 : 500;

    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to activate coupon',
    });
  }
};

/**
 * Deactivate coupon (Admin)
 * PUT /api/v1/admin/coupons/:id/deactivate
 */
exports.deactivateCoupon = async (req, res) => {
  try {
    const { id } = req.params;

    const coupon = await couponService.deactivateCoupon(id);

    return res.status(200).json({
      success: true,
      message: 'Coupon deactivated successfully',
      data: coupon,
    });
  } catch (error) {
    console.error('Admin deactivate coupon failed:', error);

    const statusCode = error.message === 'Coupon not found' ? 404 : 500;

    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to deactivate coupon',
    });
  }
};

/**
 * Get coupon usage statistics (Admin)
 * GET /api/v1/admin/coupons/:id/usage
 */
exports.getCouponUsage = async (req, res) => {
  try {
    const { id } = req.params;

    const stats = await couponService.getCouponUsageStats(id);

    if (!stats) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Admin get coupon usage failed:', error);

    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch coupon usage statistics',
    });
  }
};
