const Product = require('../../models/Product');
const Vendor = require('../../models/Vendor');
const Category = require('../../models/Category');
const User = require('../../models/User');
const mongoose = require('mongoose');
const productService = require('../productService');

/**
 * Enhanced list products for admin with advanced filters
 */
const listProducts = async (filters = {}) => {
  const {
    page = 1,
    limit = 20,
    status,
    category,
    vendor,
    search,
    stock_status,
    sort = '-createdAt',
  } = filters;

  const filterCriteria = {};

  // Status filter
  if (status) {
    filterCriteria.status = status;
  }

  // Category filter
  if (category) {
    filterCriteria.category = Array.isArray(category) ? { $in: category } : category;
  }

  // Vendor filter
  if (vendor) {
    if (mongoose.Types.ObjectId.isValid(vendor)) {
      filterCriteria.vendor = new mongoose.Types.ObjectId(vendor);
    } else {
      // Search by vendor name
      const vendors = await Vendor.find({ name: { $regex: vendor, $options: 'i' } })
        .select('_id')
        .lean();
      if (vendors.length > 0) {
        filterCriteria.vendor = { $in: vendors.map((v) => v._id) };
      } else {
        // No vendors found, return empty result
        filterCriteria.vendor = new mongoose.Types.ObjectId();
      }
    }
  }

  // Stock status filter
  if (stock_status) {
    switch (stock_status.toLowerCase()) {
      case 'in_stock':
        filterCriteria.stock = { $gt: 0 };
        break;
      case 'out_of_stock':
        filterCriteria.stock = { $lte: 0 };
        break;
      case 'low_stock':
        filterCriteria.stock = { $gt: 0, $lte: 10 };
        break;
    }
  }

  // Search filter
  if (search) {
    filterCriteria.$or = [
      { name: { $regex: search, $options: 'i' } },
      { sku: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  // Fetch products with vendor and category population
  const productsRaw = await Product.find(filterCriteria)
    .populate('vendor', 'name email contactNumber address city state pincode')
    .select(
      'name thumbnail images sellingPrice comparePrice sku status stock category tags colors vendor vendorName createdAt updatedAt isActive isVisible saleCount'
    )
    .sort(sort)
    .skip(skip)
    .limit(limitNum)
    .lean();

  const totalProducts = await Product.countDocuments(filterCriteria);

  // Enrich products with category names
  const products = await Promise.all(
    productsRaw.map(async (product) => {
      const productObj = { ...product };

      // Enrich category names
      if (productObj.category && productObj.category.length > 0) {
        const categoryIds = productObj.category.filter((cat) =>
          mongoose.Types.ObjectId.isValid(cat)
        );

        if (categoryIds.length > 0) {
          const categories = await Category.find({
            _id: { $in: categoryIds },
          })
            .select('_id name')
            .lean();

          const categoryMap = {};
          categories.forEach((cat) => {
            categoryMap[cat._id.toString()] = cat.name;
          });

          productObj.category = productObj.category.map((cat) => {
            if (mongoose.Types.ObjectId.isValid(cat)) {
              const categoryName = categoryMap[cat.toString()];
              return categoryName ? { id: cat, name: categoryName } : cat;
            }
            return cat;
          });
        }
      }

      // Add stock status
      if (productObj.stock === 0) {
        productObj.stock_status = 'out_of_stock';
      } else if (productObj.stock <= 10) {
        productObj.stock_status = 'low_stock';
      } else {
        productObj.stock_status = 'in_stock';
      }

      return productObj;
    })
  );

  return {
    products,
    pagination: {
      current_page: pageNum,
      total_pages: Math.ceil(totalProducts / limitNum),
      total_products: totalProducts,
      limit: limitNum,
      has_next_page: pageNum < Math.ceil(totalProducts / limitNum),
      has_prev_page: pageNum > 1,
    },
    filters_applied: {
      status,
      category,
      vendor,
      search,
      stock_status,
    },
  };
};

/**
 * Enhanced get product details for admin with full information
 */
const getProductDetails = async (productId) => {
  const product = await Product.findById(productId)
    .populate('vendor', 'name email contactNumber address city state pincode country gstin businessName companyName warehouse')
    .populate({
      path: 'relatedProducts',
      select: 'name thumbnail images sellingPrice comparePrice sku status stock',
    })
    .populate({
      path: 'addOnProducts',
      select: 'name thumbnail images sellingPrice comparePrice sku status stock',
    })
    .lean();

  if (!product) {
    return null;
  }

  // Enrich category names
  if (product.category && product.category.length > 0) {
    const categoryIds = product.category.filter((cat) =>
      mongoose.Types.ObjectId.isValid(cat)
    );

    if (categoryIds.length > 0) {
      const categories = await Category.find({
        _id: { $in: categoryIds },
      })
        .select('_id name description')
        .lean();

      const categoryMap = {};
      categories.forEach((cat) => {
        categoryMap[cat._id.toString()] = cat;
      });

      product.category = product.category.map((cat) => {
        if (mongoose.Types.ObjectId.isValid(cat)) {
          const categoryInfo = categoryMap[cat.toString()];
          return categoryInfo
            ? { id: cat, name: categoryInfo.name, description: categoryInfo.description }
            : cat;
        }
        return cat;
      });
    }
  }

  // Enrich reviews with user details
  if (product.reviews && product.reviews.length > 0) {
    const userIds = product.reviews
      .map((review) => review.user)
      .filter((userId) => mongoose.Types.ObjectId.isValid(userId));

    if (userIds.length > 0) {
      const users = await User.find({ _id: { $in: userIds } })
        .select('name email phoneNumber')
        .lean();

      const userMap = {};
      users.forEach((user) => {
        userMap[user._id.toString()] = user;
      });

      product.reviews = product.reviews.map((review) => {
        if (review.user && mongoose.Types.ObjectId.isValid(review.user)) {
          const user = userMap[review.user.toString()];
          return {
            ...review,
            user: user
              ? {
                  id: user._id,
                  name: user.name,
                  email: user.email,
                  phoneNumber: user.phoneNumber,
                }
              : review.user,
          };
        }
        return review;
      });
    }
  }

  // Add stock status
  if (product.stock === 0) {
    product.stock_status = 'out_of_stock';
  } else if (product.stock <= 10) {
    product.stock_status = 'low_stock';
  } else {
    product.stock_status = 'in_stock';
  }

  // Calculate average rating
  if (product.reviews && product.reviews.length > 0) {
    const ratings = product.reviews.map((r) => parseFloat(r.rating)).filter((r) => !isNaN(r));
    if (ratings.length > 0) {
      product.averageRating =
        Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10;
    }
  }

  return product;
};

/**
 * Reuse existing product service functions
 */
const createProduct = async (productData) => {
  return await productService.createProduct(productData);
};

const updateProduct = async (productId, updateData) => {
  return await productService.updateProduct(productId, updateData);
};

const deleteProduct = async (productId) => {
  return await productService.deleteProduct(productId);
};

const updateProductStatus = async (productId, status) => {
  return await productService.updateProductStatus(productId, status);
};

const updateProductStock = async (productId, stock) => {
  return await productService.updateProductStock(productId, stock);
};

const duplicateProduct = async (productId, duplicateData) => {
  return await productService.duplicateProduct(productId, duplicateData);
};

const addVideoToProduct = async (productId, videoData) => {
  return await productService.addVideoToProduct(productId, videoData);
};

const updateProductVideo = async (productId, videoKey, updateData) => {
  return await productService.updateProductVideo(productId, videoKey, updateData);
};

const removeVideoFromProduct = async (productId, videoKey) => {
  return await productService.removeVideoFromProduct(productId, videoKey);
};

const saveProductLists = async (listData) => {
  return await productService.saveProductLists(listData);
};

module.exports = {
  listProducts,
  getProductDetails,
  createProduct,
  updateProduct,
  deleteProduct,
  updateProductStatus,
  updateProductStock,
  duplicateProduct,
  addVideoToProduct,
  updateProductVideo,
  removeVideoFromProduct,
  saveProductLists,
};
