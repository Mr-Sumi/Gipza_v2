const express = require('express');
const router = express.Router();
const productControllers = require('../../controllers/admin/productControllers');
const { validate } = require('../../middleware/validator');
const {
  listProductsValidation,
  getProductDetailsValidation,
  createProductValidation,
  updateProductValidation,
  updateProductStatusValidation,
  updateProductStockValidation,
  deleteProductValidation,
  duplicateProductValidation,
  addVideoValidation,
  updateProductVideoValidation,
  removeVideoFromProductValidation,
  saveProductListsValidation,
} = require('../../validations/admin/product.validation');

/**
 * @route   GET /api/v1/admin/products
 * @desc    List all products with enhanced filters
 * @access  Admin/Manager
 */
router.get('/', validate(listProductsValidation), productControllers.listProducts);

/**
 * @route   GET /api/v1/admin/products/:id
 * @desc    Get product details with full information
 * @access  Admin/Manager
 */
router.get('/:id', validate(getProductDetailsValidation), productControllers.getProductDetails);

/**
 * @route   POST /api/v1/admin/products
 * @desc    Create product
 * @access  Admin/Manager
 */
router.post('/', validate(createProductValidation), productControllers.createProduct);

/**
 * @route   PUT /api/v1/admin/products/:id
 * @desc    Update product
 * @access  Admin/Manager
 */
router.put('/:id', validate(updateProductValidation), productControllers.updateProduct);

/**
 * @route   DELETE /api/v1/admin/products/:id
 * @desc    Delete product (soft delete)
 * @access  Admin/Manager
 */
router.delete('/:id', validate(deleteProductValidation), productControllers.deleteProduct);

/**
 * @route   PATCH /api/v1/admin/products/:id/status
 * @desc    Update product status
 * @access  Admin/Manager
 */
router.patch('/:id/status', validate(updateProductStatusValidation), productControllers.updateProductStatus);

/**
 * @route   PATCH /api/v1/admin/products/:id/stock
 * @desc    Update product stock
 * @access  Admin/Manager
 */
router.patch('/:id/stock', validate(updateProductStockValidation), productControllers.updateProductStock);

/**
 * @route   POST /api/v1/admin/products/:id/duplicate
 * @desc    Duplicate product
 * @access  Admin/Manager
 */
router.post('/:id/duplicate', validate(duplicateProductValidation), productControllers.duplicateProduct);

/**
 * @route   POST /api/v1/admin/products/:id/videos
 * @desc    Add video to product
 * @access  Admin/Manager
 */
router.post('/:id/videos', validate(addVideoValidation), productControllers.addVideoToProduct);

/**
 * @route   PUT /api/v1/admin/products/:id/videos/:videoKey
 * @desc    Update product video
 * @access  Admin/Manager
 */
router.put('/:id/videos/:videoKey', validate(updateProductVideoValidation), productControllers.updateProductVideo);

/**
 * @route   DELETE /api/v1/admin/products/:id/videos/:videoKey
 * @desc    Remove video from product
 * @access  Admin/Manager
 */
router.delete(
  '/:id/videos/:videoKey',
  validate(removeVideoFromProductValidation),
  productControllers.removeVideoFromProduct
);

/**
 * @route   POST /api/v1/admin/products/lists
 * @desc    Save product lists
 * @access  Admin/Manager
 */
router.post('/lists', validate(saveProductListsValidation), productControllers.saveProductLists);

module.exports = router;
