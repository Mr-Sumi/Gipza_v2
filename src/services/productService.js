const Product = require('../models/Product');
const Category = require('../models/Category');
const Vendor = require('../models/Vendor');
const ListStore = require('../models/ListStore');
const User = require('../models/User');
const mongoose = require('mongoose');
const draftToHtml = require('draftjs-to-html');

/**
 * Helper: Normalize array fields
 */
const normalizeArray = (value) => {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
};

/**
 * Helper: Normalize single value or array
 */
const normalizeValue = (value) => {
  if (value === undefined || value === null) return undefined;
  return Array.isArray(value) ? value : [value];
};

/**
 * Helper: Enrich single product with category names
 */
const enrichProductWithCategoryNames = async (product) => {
  const productObj = product.toObject ? product.toObject() : product;
  
  if (productObj.category && productObj.category.length > 0) {
    const categoryIds = productObj.category
      .filter(cat => mongoose.Types.ObjectId.isValid(cat));
      
    if (categoryIds.length === 0) {
      return productObj;
    }
      
    const categories = await Category.find({
      _id: { $in: categoryIds }
    }).select('_id name').lean();
      
    const categoryMap = {};
    categories.forEach(cat => {
      categoryMap[cat._id.toString()] = cat.name;
    });
      
    const enrichedCategories = productObj.category.map(cat => {
      if (mongoose.Types.ObjectId.isValid(cat)) {
        const categoryName = categoryMap[cat.toString()];
        return categoryName ? { id: cat, name: categoryName } : cat;
      }
      return cat;
    });
      
    productObj.category = enrichedCategories;
  }
  
  return productObj;
};

/**
 * Helper: Enrich multiple products with category names
 */
const enrichProductsWithCategoryNames = async (products) => {
  if (!products || products.length === 0) {
    return [];
  }
  
  const allCategoryIds = new Set();
  products.forEach(product => {
    if (product.category && product.category.length > 0) {
      product.category.forEach(cat => {
        if (mongoose.Types.ObjectId.isValid(cat)) {
          allCategoryIds.add(cat.toString());
        }
      });
    }
  });
  
  if (allCategoryIds.size === 0) {
    return products.map(p => p.toObject ? p.toObject() : p);
  }
  
  const categories = await Category.find({
    _id: { $in: Array.from(allCategoryIds) }
  }).select('_id name').lean();
  
  const categoryMap = {};
  categories.forEach(cat => {
    categoryMap[cat._id.toString()] = cat.name;
  });
  
  return products.map(product => {
    const productObj = product.toObject ? product.toObject() : product;
    
    if (productObj.category && productObj.category.length > 0) {
      productObj.category = productObj.category.map(cat => {
        if (mongoose.Types.ObjectId.isValid(cat)) {
          const categoryName = categoryMap[cat.toString()];
          return categoryName ? { id: cat, name: categoryName } : cat;
        }
        return cat;
      });
    }
    
    return productObj;
  });
};

/**
 * Get all products with pagination and filters
 */
const getAllProducts = async (options = {}) => {
  const {
    page = 1,
    limit = 15,
    category,
    status,
    search,
    sort = '-createdAt',
  } = options;

  const filterCriteria = {};

  if (category) {
    filterCriteria.category = category;
  }

  if (status) {
    filterCriteria.status = status;
  }

  if (search) {
    filterCriteria.$or = [
      { name: { $regex: search, $options: 'i' } },
      { sku: { $regex: search, $options: 'i' } },
    ];
  }

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  const productsRaw = await Product.find(filterCriteria)
    .select('name thumbnail images sellingPrice comparePrice sku status stock category tags colors createdAt updatedAt')
    .sort(sort)
    .skip(skip)
    .limit(limitNum)
    .lean();

  const totalProducts = await Product.countDocuments(filterCriteria);

  const products = await enrichProductsWithCategoryNames(productsRaw);

  return {
    products,
    totalProducts,
    totalPages: Math.ceil(totalProducts / limitNum),
    currentPage: pageNum,
    limit: limitNum,
  };
};

/**
 * Get single product by ID
 */
const getProduct = async (productId) => {
  const product = await Product.findById(productId)
    .populate({
      path: 'relatedProducts',
      select: 'name thumbnail images sellingPrice comparePrice sku status stock',
    })
    .populate({
      path: 'addOnProducts',
      select: 'name thumbnail images sellingPrice comparePrice sku status stock',
    });

  if (!product) {
    throw new Error('Product not found');
  }

  const enrichedProduct = await enrichProductWithCategoryNames(product);

  // Populate review user names
  if (enrichedProduct.reviews && enrichedProduct.reviews.length > 0) {
    for (const review of enrichedProduct.reviews) {
      if (review.user && mongoose.Types.ObjectId.isValid(review.user)) {
        const user = await User.findById(review.user).select('name').lean();
        if (user) {
          review.user = user.name;
        }
      }
    }
  }

  // Convert moreInfo from JSON to HTML if it exists
  if (enrichedProduct.moreInfo) {
    try {
      const moreInfoJson = JSON.parse(enrichedProduct.moreInfo);
      enrichedProduct.moreInfo = draftToHtml(moreInfoJson);
    } catch (error) {
      console.error('Failed to convert moreInfo to HTML:', error.message);
      enrichedProduct.moreInfo = '';
    }
  }

  // Convert highlights from JSON to HTML if it exists
  if (enrichedProduct.highlights) {
    try {
      const highlightsJson = JSON.parse(enrichedProduct.highlights);
      enrichedProduct.highlights = draftToHtml(highlightsJson);
    } catch (error) {
      console.error('Failed to convert highlights to HTML:', error.message);
      enrichedProduct.highlights = '';
    }
  }

  return enrichedProduct;
};

/**
 * Search products with advanced filters
 */
const searchProducts = async (filters = {}) => {
  const {
    query,
    category,
    minPrice,
    maxPrice,
    gender,
    color,
    status,
    page = 1,
    limit = 10,
    sort,
  } = filters;

  const filter = {};

  // Text search
  if (query && String(query).trim() !== '') {
    filter.$text = { $search: query };
  }

  // Category filter
  if (category) {
    filter.category = Array.isArray(category) ? { $in: category } : category;
  }

  // Price filter
  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.sellingPrice = {};
    if (minPrice !== undefined && minPrice !== null && minPrice !== '') {
      filter.sellingPrice.$gte = Number(minPrice);
    }
    if (maxPrice !== undefined && maxPrice !== null && maxPrice !== '') {
      filter.sellingPrice.$lte = Number(maxPrice);
    }
    if (Object.keys(filter.sellingPrice).length === 0) {
      delete filter.sellingPrice;
    }
  }

  // Gender filter
  if (gender) {
    filter.gender = Array.isArray(gender) ? { $in: gender } : gender;
  }

  // Color filter
  if (color) {
    filter.colors = Array.isArray(color) ? { $in: color } : color;
  }

  // Status filter
  if (status) {
    const normalize = (s) => {
      const val = String(s).toLowerCase();
      if (val === 'publish' || val === 'published') return 'published';
      if (val === 'draft') return 'draft';
      return null;
    };
    if (Array.isArray(status)) {
      const mapped = status.map(normalize).filter(Boolean);
      if (mapped.length > 0) {
        filter.status = { $in: mapped };
      }
    } else {
      const mapped = normalize(status);
      if (mapped) {
        filter.status = mapped;
      }
    }
  }

  // Only active products
  filter.isActive = { $ne: false };

  // Sorting
  const sortOptions = {};
  if (sort === 'low_to_high') {
    sortOptions.sellingPrice = 1;
  } else if (sort === 'high_to_low') {
    sortOptions.sellingPrice = -1;
  } else {
    if (query && String(query).trim() !== '') {
      sortOptions.score = { $meta: 'textScore' };
    } else {
      sortOptions.createdAt = -1;
    }
  }

  // Pagination
  const pageNumSafe = Number.isFinite(Number(page)) && Number(page) > 0 ? Number(page) : 1;
  const limitNumSafe = Number.isFinite(Number(limit)) && Number(limit) > 0 ? Number(limit) : 10;
  const skip = (pageNumSafe - 1) * limitNumSafe;

  // Query execution
  const products = await Product.find(filter, query ? { score: { $meta: 'textScore' } } : {})
    .select('name thumbnail images sellingPrice comparePrice sku status stock category tags colors vendor gender')
    .sort(sortOptions)
    .skip(skip)
    .limit(limitNumSafe)
    .populate('vendor', 'name')
    .lean();

  const totalProducts = await Product.countDocuments(filter);

  return {
    total: totalProducts,
    page: pageNumSafe,
    limit: limitNumSafe,
    totalPages: Math.ceil(totalProducts / limitNumSafe),
    products,
  };
};

/**
 * Get unique tags
 */
const getUniqueTags = async () => {
  const MAX_TAGS = 40;

  // Recently used tags
  const recentTagsAgg = await Product.aggregate([
    { $match: { tags: { $exists: true, $ne: [] } } },
    { $unwind: '$tags' },
    {
      $group: {
        _id: '$tags',
        lastUpdatedAt: { $max: '$updatedAt' },
        lastCreatedAt: { $max: '$createdAt' },
      },
    },
    {
      $addFields: {
        lastAt: { $ifNull: ['$lastUpdatedAt', '$lastCreatedAt'] },
      },
    },
    { $sort: { lastAt: -1 } },
    { $limit: MAX_TAGS * 2 },
    { $project: { _id: 0, tag: '$_id' } },
  ]);

  // Most used tags
  const mostUsedTagsAgg = await Product.aggregate([
    { $match: { tags: { $exists: true, $ne: [] } } },
    { $unwind: '$tags' },
    { $group: { _id: '$tags', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: MAX_TAGS * 2 },
    { $project: { _id: 0, tag: '$_id' } },
  ]);

  // Merge: prioritize recent, then fill with most used
  const seen = new Set();
  const merged = [];

  for (const r of recentTagsAgg) {
    if (!seen.has(r.tag)) {
      seen.add(r.tag);
      merged.push(r.tag);
      if (merged.length >= MAX_TAGS) break;
    }
  }

  if (merged.length < MAX_TAGS) {
    for (const m of mostUsedTagsAgg) {
      if (!seen.has(m.tag)) {
        seen.add(m.tag);
        merged.push(m.tag);
        if (merged.length >= MAX_TAGS) break;
      }
    }
  }

  return merged;
};

/**
 * Get similar products
 */
const getSimilarProducts = async (productId) => {
  const product = await Product.findById(productId);
  
  if (!product) {
    throw new Error('Product not found');
  }

  const similarProductsRaw = await Product.find({
    category: product.category,
    _id: { $ne: product._id },
    isActive: true,
    status: 'published'
  })
    .select('name thumbnail images sellingPrice comparePrice sku status stock category')
    .limit(5)
    .lean();

  const similarProducts = await enrichProductsWithCategoryNames(similarProductsRaw);

  return similarProducts;
};

/**
 * Get combo deals
 */
const getComboDeals = async (options = {}) => {
  const {
    page = 1,
    limit = 20,
    category,
    minPrice,
    maxPrice,
    sort = '-createdAt',
  } = options;

  const searchCriteria = { isCombo: true, isActive: true };

  if (category) {
    searchCriteria.category = category;
  }

  if (minPrice || maxPrice) {
    searchCriteria.sellingPrice = {};
    if (minPrice) searchCriteria.sellingPrice.$gte = Number(minPrice);
    if (maxPrice) searchCriteria.sellingPrice.$lte = Number(maxPrice);
  }

  const skip = (Number(page) - 1) * Number(limit);

  const comboDealsRaw = await Product.find(searchCriteria)
    .sort(sort)
    .skip(skip)
    .limit(Number(limit))
    .lean();

  if (!comboDealsRaw || comboDealsRaw.length === 0) {
    return {
      comboDeals: [],
      pagination: {
        totalComboDeals: 0,
        totalPages: 0,
        currentPage: Number(page),
        limit: Number(limit),
      },
    };
  }

  const totalComboDeals = await Product.countDocuments(searchCriteria);
  const comboDeals = await enrichProductsWithCategoryNames(comboDealsRaw);

  return {
    comboDeals,
    pagination: {
      totalComboDeals,
      totalPages: Math.ceil(totalComboDeals / limit),
      currentPage: Number(page),
      limit: Number(limit),
    },
  };
};

/**
 * Create product
 */
const createProduct = async (productData) => {
  // Check SKU uniqueness
  const existingProduct = await Product.findOne({ sku: productData.sku });
  if (existingProduct) {
    throw new Error(`Product with SKU ${productData.sku} already exists`);
  }

  // Normalize array fields
  const cleanedData = {
    ...productData,
    tags: normalizeArray(productData.tags),
    productTags: normalizeArray(productData.productTags),
    colors: normalizeArray(productData.colors),
    occasion: normalizeArray(productData.occasion),
    sizes: normalizeArray(productData.sizes),
    images: normalizeArray(productData.images),
    videos: normalizeArray(productData.videos),
    relatedProducts: normalizeArray(productData.relatedProducts),
    addOnProducts: normalizeArray(productData.addOnProducts),
    keywords: normalizeArray(productData.keywords),
    category: normalizeArray(productData.category),
    thumbnail: productData.thumbnail || (productData.images && productData.images.length > 0 ? productData.images[0] : null),
    weight: parseFloat(productData.weight) || 0,
    width: parseFloat(productData.width) || parseFloat(productData.dimensions?.width) || 0,
    height: parseFloat(productData.height) || parseFloat(productData.dimensions?.height) || 0,
    length: parseFloat(productData.length) || parseFloat(productData.dimensions?.length) || 0,
    isCombo: productData.isCombo === true || productData.isCombo === 'true',
    deliveryMode: productData.deliveryMode || 'manual',
    deliverablePincodes: Array.isArray(productData.deliverablePincodes) ? productData.deliverablePincodes : [],
    distanceBasedDelivery: productData.distanceBasedDelivery || { enabled: false, ranges: [] },
    isCustomizable: productData.isCustomizable === true || productData.isCustomizable === 'true',
  };

  const product = await Product.create(cleanedData);
  return await enrichProductWithCategoryNames(product);
};

/**
 * Update product
 */
const updateProduct = async (productId, updateData) => {
  const product = await Product.findById(productId);
  
  if (!product) {
    throw new Error('Product not found');
  }

  // If SKU is being updated, check for duplicates
  if (updateData.sku && updateData.sku !== product.sku) {
    const existingProduct = await Product.findOne({ sku: updateData.sku }).select('_id sku').lean();
    if (existingProduct) {
      throw new Error(`Product with SKU ${updateData.sku} already exists`);
    }
  }

  // Normalize array fields if provided
  if (updateData.tags !== undefined) updateData.tags = normalizeArray(updateData.tags);
  if (updateData.productTags !== undefined) updateData.productTags = normalizeArray(updateData.productTags);
  if (updateData.colors !== undefined) updateData.colors = normalizeArray(updateData.colors);
  if (updateData.occasion !== undefined) updateData.occasion = normalizeArray(updateData.occasion);
  if (updateData.sizes !== undefined) updateData.sizes = normalizeArray(updateData.sizes);
  if (updateData.images !== undefined) updateData.images = normalizeArray(updateData.images);
  if (updateData.videos !== undefined) updateData.videos = normalizeArray(updateData.videos);
  if (updateData.relatedProducts !== undefined) updateData.relatedProducts = normalizeArray(updateData.relatedProducts);
  if (updateData.addOnProducts !== undefined) updateData.addOnProducts = normalizeArray(updateData.addOnProducts);
  if (updateData.keywords !== undefined) updateData.keywords = normalizeArray(updateData.keywords);
  if (updateData.category !== undefined) updateData.category = normalizeArray(updateData.category);

  // Handle dimensions
  if (updateData.dimensions) {
    if (updateData.dimensions.width !== undefined) updateData.width = updateData.dimensions.width;
    if (updateData.dimensions.height !== undefined) updateData.height = updateData.dimensions.height;
    if (updateData.dimensions.length !== undefined) updateData.length = updateData.dimensions.length;
    delete updateData.dimensions;
  }

  const updatedProduct = await Product.findByIdAndUpdate(
    productId,
    updateData,
    { new: true, runValidators: true }
  );

  return await enrichProductWithCategoryNames(updatedProduct);
};

/**
 * Update product status
 */
const updateProductStatus = async (productId, status) => {
  const product = await Product.findByIdAndUpdate(
    productId,
    { status },
    { new: true }
  );

  if (!product) {
    throw new Error('Product not found');
  }

  return product;
};

/**
 * Update product stock
 */
const updateProductStock = async (productId, stock) => {
  if (stock === undefined || isNaN(parseInt(stock))) {
    throw new Error('Valid stock value is required');
  }

  const product = await Product.findByIdAndUpdate(
    productId,
    { stock: parseInt(stock) },
    { new: true }
  );

  if (!product) {
    throw new Error('Product not found');
  }

  return product;
};

/**
 * Delete product
 */
const deleteProduct = async (productId) => {
  const product = await Product.findByIdAndDelete(productId);
  
  if (!product) {
    throw new Error('Product not found');
  }

  return { message: 'Product deleted successfully' };
};

/**
 * Add video to product
 */
const addVideoToProduct = async (productId, videoData) => {
  const product = await Product.findById(productId);
  
  if (!product) {
    throw new Error('Product not found');
  }

  product.videos.push(videoData);
  await product.save();

  return product;
};

/**
 * Update product video
 */
const updateProductVideo = async (productId, videoKey, updateData) => {
  const product = await Product.findById(productId);
  
  if (!product) {
    throw new Error('Product not found');
  }

  const videoIndex = product.videos.findIndex(v => v.key === videoKey);
  
  if (videoIndex === -1) {
    throw new Error('Video not found');
  }

  Object.assign(product.videos[videoIndex], updateData);
  await product.save();

  return product;
};

/**
 * Remove video from product
 */
const removeVideoFromProduct = async (productId, videoKey) => {
  const product = await Product.findById(productId);
  
  if (!product) {
    throw new Error('Product not found');
  }

  product.videos = product.videos.filter(v => v.key !== videoKey);
  await product.save();

  return product;
};

/**
 * Add review to product
 */
const addReview = async (productId, userId, reviewData) => {
  const product = await Product.findById(productId);
  
  if (!product) {
    throw new Error('Product not found');
  }

  product.reviews.push({
    user: userId,
    rating: reviewData.rating,
    comment: reviewData.comment,
  });

  await product.save();

  return product;
};

/**
 * Duplicate product
 */
const duplicateProduct = async (productId, options = {}) => {
  const { newSku, newName, overrides } = options;

  const sourceProduct = await Product.findById(productId);
  
  if (!sourceProduct) {
    throw new Error('Source product not found');
  }

  const productData = sourceProduct.toObject();

  // Remove fields that should not be duplicated
  delete productData._id;
  delete productData.createdAt;
  delete productData.updatedAt;
  delete productData.__v;
  delete productData.reviews;
  delete productData.saleCount;

  // Generate new SKU
  if (!newSku) {
    const timestamp = Date.now().toString().slice(-6);
    productData.sku = `${sourceProduct.sku}-COPY-${timestamp}`;
  } else {
    productData.sku = newSku;
  }

  // Set new name
  if (newName) {
    productData.name = newName;
  } else {
    productData.name = `${sourceProduct.name} (Copy)`;
  }

  // Check SKU uniqueness
  const existingProduct = await Product.findOne({ sku: productData.sku }).select('_id sku').lean();
  if (existingProduct) {
    throw new Error(`Product with SKU ${productData.sku} already exists. Please provide a different SKU.`);
  }

  // Apply overrides
  if (overrides && typeof overrides === 'object') {
    Object.keys(overrides).forEach(key => {
      if (key !== '_id' && key !== 'createdAt' && key !== 'updatedAt' && key !== '__v') {
        productData[key] = overrides[key];
      }
    });
  }

  const newProduct = await Product.create(productData);
  return await enrichProductWithCategoryNames(newProduct);
};

/**
 * Save product lists (helper function)
 */
const saveList = async (listData, userId) => {
  if (!listData.name || !listData.type || !listData.content) {
    throw new Error('List name, type, and content are required');
  }

  const allowedTypes = ['vendor', 'pincode', 'category', 'tag', 'size', 'color', 'occasion'];
  if (!allowedTypes.includes(listData.type)) {
    throw new Error(`List type must be one of: ${allowedTypes.join(', ')}`);
  }

  const list = await ListStore.findOneAndUpdate(
    { name: listData.name, type: listData.type },
    {
      name: listData.name,
      description: listData.description || '',
      type: listData.type,
      content: listData.content,
      createdBy: userId,
    },
    { new: true, upsert: true }
  );

  return list;
};

/**
 * Save product lists
 */
const saveProductLists = async (lists, userId) => {
  if (!lists || typeof lists !== 'object') {
    throw new Error('Lists data is required');
  }

  const results = {};

  for (const [type, listData] of Object.entries(lists)) {
    if (!listData || !listData.name || !listData.content) continue;

    try {
      results[type] = await saveList({
        name: listData.name,
        description: listData.description || `${type} list created from product`,
        type: type,
        content: listData.content,
      }, userId);
    } catch (error) {
      console.error(`Error saving ${type} list:`, error);
      results[type] = { error: error.message };
    }
  }

  return results;
};

module.exports = {
  getAllProducts,
  getProduct,
  searchProducts,
  getUniqueTags,
  getSimilarProducts,
  getComboDeals,
  createProduct,
  updateProduct,
  updateProductStatus,
  updateProductStock,
  deleteProduct,
  addVideoToProduct,
  updateProductVideo,
  removeVideoFromProduct,
  addReview,
  duplicateProduct,
  saveProductLists,
};

