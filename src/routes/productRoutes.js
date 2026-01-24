const express = require('express');
const router = express.Router();
const productControllers = require('../controllers/productControllers');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validator');
const {
  getAllProductsValidation,
  searchProductsValidation,
  getProductValidation,
  getSimilarProductsValidation,
  getComboDealsValidation,
  addReviewValidation,
} = require('../validations/product.validation');

// Public routes - anyone can view products
router.get('/', validate(getAllProductsValidation), productControllers.getAllProducts);
router.get('/search', validate(searchProductsValidation), productControllers.searchProducts);
router.post('/search', validate(searchProductsValidation), productControllers.searchProducts);
router.get('/tags', productControllers.getUniqueTags);
router.get('/combo-deals', validate(getComboDealsValidation), productControllers.getComboDeals);
router.get('/:id', validate(getProductValidation), productControllers.getProduct);
router.get('/:id/similar', validate(getSimilarProductsValidation), productControllers.getSimilarProducts);

// Protected routes - require authentication
router.use(authenticate);

// User routes - authenticated users can add reviews
router.post('/:id/review', validate(addReviewValidation), productControllers.addReview);

// Note: Admin routes have been moved to /api/v1/admin/products

module.exports = router;

