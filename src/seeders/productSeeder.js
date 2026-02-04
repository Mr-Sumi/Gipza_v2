const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { connectDB } = require('../config/db');

// Load environment variables
dotenv.config();

// Import models
const Product = require('../models/Product');
const Category = require('../models/Category');
const Color = require('../models/Color');
const Vendor = require('../models/Vendor');

/**
 * Sample product data for seeding
 */
const sampleProducts = [
  {
    name: 'Premium Ceramic Vase Set',
    description: 'Beautiful handcrafted ceramic vase set perfect for home decoration. Available in multiple colors.',
    sku: 'VASE-001',
    sellingPrice: 1299,
    comparePrice: 1799,
    category: ['Home Decor', 'Vases'],
    tags: ['ceramic', 'vase', 'home decor', 'gift'],
    productTags: ['premium', 'handcrafted'],
    colors: ['White', 'Blue', 'Beige'],
    occasion: ['Housewarming', 'Anniversary', 'Birthday'],
    gender: ['Unisex'],
    stock: 50,
    weight: 1.2,
    width: 15,
    height: 25,
    length: 15,
    materialType: 'Ceramic',
    status: 'published',
    isActive: true,
    isVisible: true,
  },
  {
    name: 'Decorative Wall Art Canvas',
    description: 'Modern abstract wall art canvas print. Perfect for living room or bedroom decoration.',
    sku: 'WALL-001',
    sellingPrice: 899,
    comparePrice: 1299,
    category: ['Home Decor', 'Wall Art'],
    tags: ['canvas', 'wall art', 'modern', 'abstract'],
    productTags: ['decorative', 'print'],
    colors: ['Multicolor'],
    occasion: ['Housewarming', 'Corporate'],
    gender: ['Unisex'],
    stock: 30,
    weight: 0.5,
    width: 60,
    height: 40,
    length: 2,
    materialType: 'Canvas',
    status: 'published',
    isActive: true,
    isVisible: true,
  },
  {
    name: 'Luxury Silk Cushion Covers',
    description: 'Premium silk cushion covers with elegant designs. Set of 2 pieces.',
    sku: 'CUSH-001',
    sellingPrice: 599,
    comparePrice: 899,
    category: ['Home Decor', 'Cushions'],
    tags: ['silk', 'cushion', 'luxury', 'soft'],
    productTags: ['premium', 'elegant'],
    colors: ['Red', 'Blue', 'Gold'],
    occasion: ['Housewarming', 'Wedding'],
    gender: ['Unisex'],
    stock: 75,
    weight: 0.3,
    width: 45,
    height: 45,
    length: 5,
    materialType: 'Silk',
    status: 'published',
    isActive: true,
    isVisible: true,
  },
  {
    name: 'Aromatherapy Essential Oil Set',
    description: 'Set of 6 essential oils for aromatherapy. Includes lavender, eucalyptus, peppermint, and more.',
    sku: 'OIL-001',
    sellingPrice: 1499,
    comparePrice: 1999,
    category: ['Wellness', 'Aromatherapy'],
    tags: ['essential oils', 'aromatherapy', 'wellness', 'relaxation'],
    productTags: ['premium', 'natural'],
    colors: ['Multicolor'],
    occasion: ['Birthday', 'Anniversary', 'Self Care'],
    gender: ['Unisex'],
    stock: 40,
    weight: 0.8,
    width: 20,
    height: 25,
    length: 20,
    materialType: 'Glass',
    status: 'published',
    isActive: true,
    isVisible: true,
  },
  {
    name: 'Designer Table Lamp',
    description: 'Modern designer table lamp with LED lighting. Perfect for study or bedside table.',
    sku: 'LAMP-001',
    sellingPrice: 1999,
    comparePrice: 2999,
    category: ['Home Decor', 'Lighting'],
    tags: ['lamp', 'LED', 'modern', 'designer'],
    productTags: ['premium', 'energy efficient'],
    colors: ['Black', 'White', 'Gold'],
    occasion: ['Housewarming', 'Corporate'],
    gender: ['Unisex'],
    stock: 25,
    weight: 2.5,
    width: 25,
    height: 45,
    length: 25,
    materialType: 'Metal',
    status: 'published',
    isActive: true,
    isVisible: true,
  },
  {
    name: 'Premium Coffee Gift Set',
    description: 'Luxury coffee gift set with premium beans, French press, and coffee mugs. Perfect for coffee lovers.',
    sku: 'COFFEE-001',
    sellingPrice: 2499,
    comparePrice: 3499,
    category: ['Food & Beverages', 'Coffee'],
    tags: ['coffee', 'gift set', 'premium', 'beans'],
    productTags: ['luxury', 'gift'],
    colors: ['Brown', 'Black'],
    occasion: ['Birthday', 'Anniversary', 'Corporate'],
    gender: ['Unisex'],
    stock: 20,
    weight: 1.8,
    width: 30,
    height: 30,
    length: 30,
    materialType: 'Mixed',
    isCombo: true,
    status: 'published',
    isActive: true,
    isVisible: true,
  },
  {
    name: 'Handmade Pottery Bowl Set',
    description: 'Set of 4 handmade pottery bowls in different sizes. Perfect for serving and decoration.',
    sku: 'BOWL-001',
    sellingPrice: 799,
    comparePrice: 1199,
    category: ['Home Decor', 'Pottery'],
    tags: ['pottery', 'bowl', 'handmade', 'artisan'],
    productTags: ['handcrafted', 'unique'],
    colors: ['Terracotta', 'Blue', 'White'],
    occasion: ['Housewarming', 'Wedding'],
    gender: ['Unisex'],
    stock: 60,
    weight: 1.5,
    width: 20,
    height: 10,
    length: 20,
    materialType: 'Clay',
    status: 'published',
    isActive: true,
    isVisible: true,
  },
  {
    name: 'Elegant Photo Frame Set',
    description: 'Set of 3 elegant wooden photo frames in different sizes. Perfect for displaying memories.',
    sku: 'FRAME-001',
    sellingPrice: 499,
    comparePrice: 799,
    category: ['Home Decor', 'Photo Frames'],
    tags: ['photo frame', 'wooden', 'memories', 'elegant'],
    productTags: ['classic', 'timeless'],
    colors: ['Brown', 'Black', 'White'],
    occasion: ['Anniversary', 'Birthday', 'Wedding'],
    gender: ['Unisex'],
    stock: 45,
    weight: 0.8,
    width: 25,
    height: 30,
    length: 3,
    materialType: 'Wood',
    status: 'published',
    isActive: true,
    isVisible: true,
  },
  {
    name: 'Premium Scented Candles Pack',
    description: 'Set of 6 premium scented candles in various fragrances. Long-lasting and beautifully packaged.',
    sku: 'CANDLE-001',
    sellingPrice: 899,
    comparePrice: 1299,
    category: ['Home Decor', 'Candles'],
    tags: ['candles', 'scented', 'aromatherapy', 'relaxation'],
    productTags: ['premium', 'long lasting'],
    colors: ['White', 'Red', 'Blue'],
    occasion: ['Birthday', 'Anniversary', 'Housewarming'],
    gender: ['Unisex'],
    stock: 55,
    weight: 1.0,
    width: 8,
    height: 12,
    length: 8,
    materialType: 'Wax',
    status: 'published',
    isActive: true,
    isVisible: true,
  },
  {
    name: 'Modern Plant Pot Set',
    description: 'Set of 3 modern geometric plant pots with drainage. Perfect for indoor plants.',
    sku: 'POT-001',
    sellingPrice: 699,
    comparePrice: 999,
    category: ['Home Decor', 'Planters'],
    tags: ['plant pot', 'geometric', 'modern', 'indoor'],
    productTags: ['contemporary', 'functional'],
    colors: ['White', 'Gray', 'Black'],
    occasion: ['Housewarming', 'Birthday'],
    gender: ['Unisex'],
    stock: 70,
    weight: 0.6,
    width: 15,
    height: 15,
    length: 15,
    materialType: 'Ceramic',
    status: 'published',
    isActive: true,
    isVisible: true,
  },
  {
    name: 'Luxury Bath Gift Set',
    description: 'Premium bath and body gift set with body wash, lotion, and bath salts. Perfect spa experience.',
    sku: 'BATH-001',
    sellingPrice: 1299,
    comparePrice: 1799,
    category: ['Wellness', 'Bath & Body'],
    tags: ['bath', 'spa', 'luxury', 'relaxation'],
    productTags: ['premium', 'gift'],
    colors: ['White', 'Pink', 'Blue'],
    occasion: ['Birthday', 'Anniversary', 'Self Care'],
    gender: ['Female', 'Unisex'],
    stock: 35,
    weight: 1.2,
    width: 25,
    height: 20,
    length: 15,
    materialType: 'Mixed',
    isCombo: true,
    status: 'published',
    isActive: true,
    isVisible: true,
  },
  {
    name: 'Artisan Wooden Coaster Set',
    description: 'Set of 6 handcrafted wooden coasters with unique designs. Protects surfaces in style.',
    sku: 'COAST-001',
    sellingPrice: 399,
    comparePrice: 599,
    category: ['Home Decor', 'Coasters'],
    tags: ['coaster', 'wooden', 'handcrafted', 'protective'],
    productTags: ['artisan', 'functional'],
    colors: ['Brown', 'Natural'],
    occasion: ['Housewarming', 'Corporate'],
    gender: ['Unisex'],
    stock: 80,
    weight: 0.4,
    width: 10,
    height: 10,
    length: 1,
    materialType: 'Wood',
    status: 'published',
    isActive: true,
    isVisible: true,
  },
  {
    name: 'Premium Tea Gift Box',
    description: 'Luxury tea gift box with 12 different tea varieties. Includes green, black, and herbal teas.',
    sku: 'TEA-001',
    sellingPrice: 999,
    comparePrice: 1499,
    category: ['Food & Beverages', 'Tea'],
    tags: ['tea', 'gift box', 'premium', 'variety'],
    productTags: ['luxury', 'gift'],
    colors: ['Green', 'Brown', 'Multicolor'],
    occasion: ['Birthday', 'Anniversary', 'Corporate'],
    gender: ['Unisex'],
    stock: 30,
    weight: 0.9,
    width: 25,
    height: 20,
    length: 15,
    materialType: 'Mixed',
    status: 'published',
    isActive: true,
    isVisible: true,
  },
  {
    name: 'Decorative Throw Pillow Set',
    description: 'Set of 2 decorative throw pillows with premium fabric. Adds comfort and style to any room.',
    sku: 'PILLOW-001',
    sellingPrice: 699,
    comparePrice: 999,
    category: ['Home Decor', 'Pillows'],
    tags: ['pillow', 'throw', 'decorative', 'comfort'],
    productTags: ['premium', 'stylish'],
    colors: ['Red', 'Blue', 'Gold', 'Gray'],
    occasion: ['Housewarming', 'Wedding'],
    gender: ['Unisex'],
    stock: 50,
    weight: 0.5,
    width: 50,
    height: 50,
    length: 10,
    materialType: 'Fabric',
    status: 'published',
    isActive: true,
    isVisible: true,
  },
  {
    name: 'Elegant Dinnerware Set',
    description: 'Complete dinnerware set for 4 people. Includes plates, bowls, and mugs in elegant design.',
    sku: 'DINNER-001',
    sellingPrice: 2999,
    comparePrice: 3999,
    category: ['Home Decor', 'Dinnerware'],
    tags: ['dinnerware', 'plates', 'elegant', 'complete set'],
    productTags: ['premium', 'complete'],
    colors: ['White', 'Cream', 'Blue'],
    occasion: ['Wedding', 'Housewarming', 'Anniversary'],
    gender: ['Unisex'],
    stock: 15,
    weight: 3.5,
    width: 30,
    height: 30,
    length: 30,
    materialType: 'Ceramic',
    isCombo: true,
    status: 'published',
    isActive: true,
    isVisible: true,
  },
  {
    name: 'Aromatherapy Diffuser',
    description: 'Ultrasonic aromatherapy diffuser with LED lights. Creates relaxing atmosphere with essential oils.',
    sku: 'DIFF-001',
    sellingPrice: 1499,
    comparePrice: 1999,
    category: ['Wellness', 'Aromatherapy'],
    tags: ['diffuser', 'aromatherapy', 'LED', 'ultrasonic'],
    productTags: ['premium', 'modern'],
    colors: ['White', 'Black', 'Wood'],
    occasion: ['Housewarming', 'Self Care'],
    gender: ['Unisex'],
    stock: 40,
    weight: 0.7,
    width: 12,
    height: 15,
    length: 12,
    materialType: 'Plastic',
    status: 'published',
    isActive: true,
    isVisible: true,
  },
  {
    name: 'Handwoven Basket Set',
    description: 'Set of 3 handwoven storage baskets in different sizes. Perfect for organizing and decoration.',
    sku: 'BASKET-001',
    sellingPrice: 799,
    comparePrice: 1199,
    category: ['Home Decor', 'Storage'],
    tags: ['basket', 'handwoven', 'storage', 'organizing'],
    productTags: ['handcrafted', 'functional'],
    colors: ['Natural', 'Brown', 'Beige'],
    occasion: ['Housewarming', 'Wedding'],
    gender: ['Unisex'],
    stock: 45,
    weight: 0.9,
    width: 30,
    height: 20,
    length: 30,
    materialType: 'Rattan',
    status: 'published',
    isActive: true,
    isVisible: true,
  },
  {
    name: 'Premium Chocolate Gift Box',
    description: 'Luxury chocolate gift box with assorted premium chocolates. Perfect for gifting.',
    sku: 'CHOCO-001',
    sellingPrice: 599,
    comparePrice: 899,
    category: ['Food & Beverages', 'Chocolates'],
    tags: ['chocolate', 'gift box', 'premium', 'assorted'],
    productTags: ['luxury', 'gift'],
    colors: ['Brown', 'Gold'],
    occasion: ['Birthday', 'Anniversary', 'Valentine'],
    gender: ['Unisex'],
    stock: 60,
    weight: 0.5,
    width: 20,
    height: 15,
    length: 20,
    materialType: 'Mixed',
    status: 'published',
    isActive: true,
    isVisible: true,
  },
  {
    name: 'Modern Wall Clock',
    description: 'Sleek modern wall clock with silent mechanism. Perfect for any room decoration.',
    sku: 'CLOCK-001',
    sellingPrice: 899,
    comparePrice: 1299,
    category: ['Home Decor', 'Clocks'],
    tags: ['clock', 'wall clock', 'modern', 'silent'],
    productTags: ['contemporary', 'functional'],
    colors: ['Black', 'White', 'Gold'],
    occasion: ['Housewarming', 'Corporate'],
    gender: ['Unisex'],
    stock: 35,
    weight: 0.6,
    width: 40,
    height: 40,
    length: 5,
    materialType: 'Metal',
    status: 'published',
    isActive: true,
    isVisible: true,
  },
  {
    name: 'Premium Yoga Mat',
    description: 'High-quality non-slip yoga mat with carrying strap. Perfect for practice and meditation.',
    sku: 'YOGA-001',
    sellingPrice: 1299,
    comparePrice: 1799,
    category: ['Wellness', 'Fitness'],
    tags: ['yoga mat', 'fitness', 'non-slip', 'meditation'],
    productTags: ['premium', 'professional'],
    colors: ['Purple', 'Blue', 'Pink'],
    occasion: ['Birthday', 'Self Care'],
    gender: ['Unisex'],
    stock: 25,
    weight: 1.2,
    width: 68,
    height: 173,
    length: 0.5,
    materialType: 'PVC',
    status: 'published',
    isActive: true,
    isVisible: true,
  },
  {
    name: 'Elegant Table Runner Set',
    description: 'Set of 2 elegant table runners in premium fabric. Perfect for dining table decoration.',
    sku: 'RUNNER-001',
    sellingPrice: 499,
    comparePrice: 799,
    category: ['Home Decor', 'Table Linens'],
    tags: ['table runner', 'elegant', 'dining', 'decoration'],
    productTags: ['premium', 'elegant'],
    colors: ['White', 'Cream', 'Gold'],
    occasion: ['Wedding', 'Housewarming'],
    gender: ['Unisex'],
    stock: 55,
    weight: 0.3,
    width: 150,
    height: 40,
    length: 0.5,
    materialType: 'Fabric',
    status: 'published',
    isActive: true,
    isVisible: true,
  },
  {
    name: 'Artisan Soap Gift Set',
    description: 'Set of 6 handmade artisan soaps in different fragrances. Natural and gentle on skin.',
    sku: 'SOAP-001',
    sellingPrice: 699,
    comparePrice: 999,
    category: ['Wellness', 'Bath & Body'],
    tags: ['soap', 'handmade', 'artisan', 'natural'],
    productTags: ['handcrafted', 'natural'],
    colors: ['White', 'Pink', 'Blue', 'Green'],
    occasion: ['Birthday', 'Anniversary', 'Self Care'],
    gender: ['Unisex'],
    stock: 50,
    weight: 0.4,
    width: 8,
    height: 8,
    length: 3,
    materialType: 'Soap',
    status: 'published',
    isActive: true,
    isVisible: true,
  },
  {
    name: 'Decorative Mirror Set',
    description: 'Set of 3 decorative wall mirrors in different sizes. Adds elegance to any space.',
    sku: 'MIRROR-001',
    sellingPrice: 1999,
    comparePrice: 2999,
    category: ['Home Decor', 'Mirrors'],
    tags: ['mirror', 'decorative', 'wall', 'elegant'],
    productTags: ['premium', 'elegant'],
    colors: ['Silver', 'Gold', 'Black'],
    occasion: ['Housewarming', 'Wedding'],
    gender: ['Unisex'],
    stock: 20,
    weight: 2.0,
    width: 30,
    height: 40,
    length: 2,
    materialType: 'Glass',
    status: 'published',
    isActive: true,
    isVisible: true,
  },
  {
    name: 'Premium Incense Sticks Pack',
    description: 'Pack of 100 premium incense sticks in various fragrances. Creates peaceful atmosphere.',
    sku: 'INCENSE-001',
    sellingPrice: 299,
    comparePrice: 499,
    category: ['Wellness', 'Aromatherapy'],
    tags: ['incense', 'aromatherapy', 'meditation', 'peaceful'],
    productTags: ['premium', 'long lasting'],
    colors: ['Brown', 'Multicolor'],
    occasion: ['Self Care', 'Meditation'],
    gender: ['Unisex'],
    stock: 90,
    weight: 0.2,
    width: 5,
    height: 25,
    length: 5,
    materialType: 'Mixed',
    status: 'published',
    isActive: true,
    isVisible: true,
  },
  {
    name: 'Luxury Bath Towel Set',
    description: 'Set of 4 premium bath towels in soft, absorbent fabric. Perfect for spa-like experience.',
    sku: 'TOWEL-001',
    sellingPrice: 1499,
    comparePrice: 1999,
    category: ['Home Decor', 'Bath Linens'],
    tags: ['towel', 'bath', 'premium', 'soft'],
    productTags: ['luxury', 'absorbent'],
    colors: ['White', 'Blue', 'Gray', 'Beige'],
    occasion: ['Housewarming', 'Wedding'],
    gender: ['Unisex'],
    stock: 30,
    weight: 1.5,
    width: 70,
    height: 140,
    length: 2,
    materialType: 'Cotton',
    status: 'published',
    isActive: true,
    isVisible: true,
  },
  {
    name: 'Modern Desk Organizer',
    description: 'Sleek desk organizer with multiple compartments. Keeps your workspace neat and organized.',
    sku: 'DESK-001',
    sellingPrice: 599,
    comparePrice: 899,
    category: ['Home Decor', 'Organizers'],
    tags: ['desk organizer', 'office', 'modern', 'functional'],
    productTags: ['contemporary', 'functional'],
    colors: ['Black', 'White', 'Gray'],
    occasion: ['Corporate', 'Housewarming'],
    gender: ['Unisex'],
    stock: 65,
    weight: 0.7,
    width: 30,
    height: 15,
    length: 20,
    materialType: 'Plastic',
    status: 'published',
    isActive: true,
    isVisible: true,
  },
  {
    name: 'Premium Gift Wrapping Set',
    description: 'Complete gift wrapping set with premium papers, ribbons, and accessories. Perfect for any occasion.',
    sku: 'WRAP-001',
    sellingPrice: 399,
    comparePrice: 599,
    category: ['Gifts', 'Wrapping'],
    tags: ['gift wrapping', 'ribbons', 'papers', 'accessories'],
    productTags: ['complete', 'premium'],
    colors: ['Multicolor'],
    occasion: ['Birthday', 'Anniversary', 'Wedding'],
    gender: ['Unisex'],
    stock: 100,
    weight: 0.3,
    width: 30,
    height: 20,
    length: 10,
    materialType: 'Paper',
    status: 'published',
    isActive: true,
    isVisible: true,
  },
];

/**
 * Seed categories
 */
const seedCategories = async () => {
  const categories = [
    { name: 'Home Decor', image: 'https://example.com/home-decor.jpg' },
    { name: 'Wellness', image: 'https://example.com/wellness.jpg' },
    { name: 'Food & Beverages', image: 'https://example.com/food.jpg' },
    { name: 'Gifts', image: 'https://example.com/gifts.jpg' },
  ];

  for (const cat of categories) {
    await Category.findOneAndUpdate(
      { name: cat.name },
      cat,
      { upsert: true, new: true }
    );
  }
  console.log('✅ Categories seeded');
};

/**
 * Seed colors
 */
const seedColors = async () => {
  const colors = [
    { name: 'White', hex: '#FFFFFF' },
    { name: 'Black', hex: '#000000' },
    { name: 'Red', hex: '#FF0000' },
    { name: 'Blue', hex: '#0000FF' },
    { name: 'Gold', hex: '#FFD700' },
    { name: 'Gray', hex: '#808080' },
    { name: 'Beige', hex: '#F5F5DC' },
    { name: 'Brown', hex: '#A52A2A' },
    { name: 'Pink', hex: '#FFC0CB' },
    { name: 'Green', hex: '#008000' },
    { name: 'Purple', hex: '#800080' },
    { name: 'Terracotta', hex: '#E2725B' },
    { name: 'Cream', hex: '#FFFDD0' },
    { name: 'Silver', hex: '#C0C0C0' },
    { name: 'Natural', hex: '#F5E6D3' },
    { name: 'Multicolor', hex: '#FF00FF' },
  ];

  for (const color of colors) {
    await Color.findOneAndUpdate(
      { name: color.name },
      color,
      { upsert: true, new: true }
    );
  }
  console.log('✅ Colors seeded');
};

/**
 * Seed vendors
 */
const seedVendors = async () => {
  const vendors = [
    {
      name: 'Gipza Main Warehouse',
      email: 'warehouse@gipza.com',
      address: '123 Main Street, Industrial Area',
      pincode: '560001',
      city: 'Bangalore',
      state: 'Karnataka',
      country: 'India',
      contactName: 'John Doe',
      contactNumber: '9876543210',
      status: 'published',
    },
    {
      name: 'Gipza Mumbai Hub',
      email: 'mumbai@gipza.com',
      address: '456 Business Park, Andheri',
      pincode: '400053',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      contactName: 'Jane Smith',
      contactNumber: '9876543211',
      status: 'published',
    },
  ];

  const createdVendors = [];
  for (const vendor of vendors) {
    const v = await Vendor.findOneAndUpdate(
      { name: vendor.name },
      vendor,
      { upsert: true, new: true }
    );
    createdVendors.push(v);
  }
  console.log('✅ Vendors seeded');
  return createdVendors;
};

/**
 * Seed products
 */
const seedProducts = async (vendors) => {
  // Clear existing products (optional - comment out if you want to keep existing)
  // await Product.deleteMany({});

  const createdProducts = [];
  const vendor = vendors[0]; // Use first vendor

  for (const productData of sampleProducts) {
    try {
      // Check if product with same SKU exists
      const existingProduct = await Product.findOne({ sku: productData.sku });
      
      if (existingProduct) {
        console.log(`⏭️  Product ${productData.sku} already exists, skipping...`);
        continue;
      }

      // Create product with vendor
      const product = await Product.create({
        ...productData,
        vendor: vendor._id,
        vendorName: vendor.name,
        purchaseCost: productData.sellingPrice * 0.6, // 60% of selling price
        tax: productData.sellingPrice * 0.18, // 18% GST
        otherCost: productData.sellingPrice * 0.05, // 5% other costs
        totalCost: productData.sellingPrice * 0.83, // Total cost
        thumbnail: `https://example.com/products/${productData.sku.toLowerCase()}-thumb.jpg`,
        images: [
          `https://example.com/products/${productData.sku.toLowerCase()}-1.jpg`,
          `https://example.com/products/${productData.sku.toLowerCase()}-2.jpg`,
        ],
        hsnCode: '9983',
        highlights: JSON.stringify({ points: ['Premium Quality', 'Elegant Design', 'Perfect Gift'] }),
        moreInfo: JSON.stringify({ description: productData.description }),
        deliveryMode: 'manual',
        deliverablePincodes: [
          { code: '560001', area: 'Bangalore Central', city: 'Bangalore' },
          { code: '400053', area: 'Andheri', city: 'Mumbai' },
        ],
        metaTitle: `${productData.name} - Gipza`,
        metaDescription: productData.description,
        keywords: [...productData.tags, ...productData.productTags],
      });

      createdProducts.push(product);
      console.log(`✅ Created product: ${product.name} (${product.sku})`);
    } catch (error) {
      console.error(`❌ Error creating product ${productData.sku}:`, error.message);
    }
  }

  return createdProducts;
};

/**
 * Main seeder function
 */
const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...\n');

  
    await connectDB();

    await seedCategories();
    await seedColors();
    const vendors = await seedVendors();
    const products = await seedProducts(vendors);

    console.log(`\n✅ Seeding completed successfully!`);
    console.log(`📊 Summary:`);
    console.log(`   - Products created: ${products.length}`);
    console.log(`   - Total products in database: ${await Product.countDocuments()}`);

    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };

