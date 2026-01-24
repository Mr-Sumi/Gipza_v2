const axios = require('axios');
const Product = require('../models/Product');
const Vendor = require('../models/Vendor');
const delhiveryConfig = require('../config/delhivery');

/**
 * Calculate total weight for products in a vendor order
 * @param {Array} products - Array of product objects with quantity
 * @returns {Promise<number>} Total weight in kg
 */
const calculateVendorOrderWeight = async (products) => {
  let totalWeight = 0;

  for (const productItem of products) {
    const product = await Product.findById(productItem.id)
      .select('weight')
      .lean();

    const productWeight = product?.weight || 0.1; // Default 0.1kg
    totalWeight += productWeight * (productItem.quantity || 1);
  }

  // Minimum weight is 0.5kg
  return Math.max(0.5, totalWeight);
};

/**
 * Create shipment with Delhivery for a vendor order
 * @param {Object} vendorOrder - Vendor order object
 * @param {Object} vendor - Vendor object (populated)
 * @param {Object} mainOrder - Main order object with shipping address and user info
 * @returns {Promise<Object>} Shipment creation result with waybill
 */
const createDelhiveryShipment = async (vendorOrder, vendor, mainOrder) => {
  try {
    if (!delhiveryConfig.isConfigured()) {
      throw new Error('Delhivery API key not configured. Please set DELHIVERY_API_KEY in .env');
    }

    // Check if waybill already exists
    if (vendorOrder.waybill_no) {
      console.log(`Shipment already exists for vendor order ${vendorOrder.sub_order_id}. Waybill: ${vendorOrder.waybill_no}`);
      return {
        success: true,
        waybill: vendorOrder.waybill_no,
        existing: true,
      };
    }

    // Validate vendor warehouse registration
    if (!vendor.warehouse || vendor.warehouse.status !== 'registered') {
      throw new Error(`Vendor ${vendor.name} warehouse is not registered with Delhivery. Please register warehouse first.`);
    }

    // Get pickup location name (must match registered warehouse name)
    const pickupLocationName = vendor.warehouse.name || vendor.vendor_delevery_name || vendor.delhiveryPickupLocationName;
    if (!pickupLocationName) {
      throw new Error(`Pickup location name not found for vendor ${vendor.name}. Please register warehouse first.`);
    }

    // Store pickup location for error handling
    const vendorPickupLocation = pickupLocationName;

    // Validate required fields and provide specific error messages
    const missingFields = [];
    if (!vendor.address) missingFields.push('address');
    if (!vendor.pincode) missingFields.push('pincode');
    if (!vendor.city) missingFields.push('city');
    if (!vendor.state) missingFields.push('state');
    if (!vendor.contactNumber) missingFields.push('contactNumber');
    
    if (missingFields.length > 0) {
      throw new Error(
        `Incomplete vendor address details for ${vendor.name}. Missing fields: ${missingFields.join(', ')}. ` +
        `Please update the vendor profile with complete address information.`
      );
    }

    if (!mainOrder.shipping_address || !mainOrder.shipping_address.zipCode) {
      throw new Error('Shipping address is missing or incomplete');
    }

    // Get user phone number
    const User = require('../models/User');
    const user = await User.findById(mainOrder.user_id).select('phoneNumber email name').lean();
    const customerPhone = (mainOrder.shipping_address.phone || user?.phoneNumber || '').replace(/\D/g, '');
    
    if (!customerPhone || customerPhone.length < 10) {
      throw new Error('Customer phone number is required and must be at least 10 digits');
    }

    // Calculate total weight
    const totalWeight = await calculateVendorOrderWeight(vendorOrder.products);
    const totalQuantity = vendorOrder.products.reduce((sum, p) => sum + (p.quantity || 1), 0);

    // Collect product descriptions and HSN codes
    const productDescriptions = [];
    const hsnCodes = [];

    for (const productItem of vendorOrder.products) {
      const product = await Product.findById(productItem.id)
        .select('name hsnCode description')
        .lean();

      const productName = product?.name || 'Item';
      productDescriptions.push(`${productName} (Qty: ${productItem.quantity || 1})`);

      if (product?.hsnCode && !hsnCodes.includes(product.hsnCode)) {
        hsnCodes.push(product.hsnCode);
      }
    }

    // Calculate package dimensions (use defaults if product dimensions not available)
    const firstProduct = vendorOrder.products[0];
    let productDoc = null;
    if (firstProduct) {
      productDoc = await Product.findById(firstProduct.id).select('length width height').lean();
    }

    const finalLength = productDoc?.length ? Math.min(Math.max(productDoc.length, 5), 100) : 10; // Min 5cm, Max 100cm
    const finalWidth = productDoc?.width ? Math.min(Math.max(productDoc.width, 5), 100) : 10;
    const finalHeight = productDoc?.height ? Math.min(Math.max(productDoc.height, 2), 50) : 10; // Min 2cm, Max 50cm

    // Format vendor phone
    const vendorPhone = (vendor.contactNumber || '').replace(/\D/g, '');
    if (!vendorPhone || vendorPhone.length < 10) {
      throw new Error('Vendor phone number is required and must be at least 10 digits');
    }

    // Prepare shipment payload
    const shipmentData = {
      shipments: [{
        // Customer/Consignee Details
        name: (mainOrder.shipping_address.name || user?.name || 'Customer').trim(),
        order: mainOrder.user_order_id || mainOrder._id.toString(),
        phone: [customerPhone],
        add: (mainOrder.shipping_address.street || mainOrder.shipping_address.address || '').trim(),
        pin: parseInt(mainOrder.shipping_address.zipCode),
        address_type: 'home',
        ewbn: '',
        hsn_code: hsnCodes[0] || '6109',
        shipping_mode: 'Surface',
        seller_inv: vendorOrder.sub_order_id || '',
        city: mainOrder.shipping_address.city || '',
        weight: totalWeight,
        return_name: vendor.name,
        return_address: vendor.address,
        return_city: vendor.city,
        return_phone: [vendorPhone],
        return_state: vendor.state,
        return_country: vendor.country || 'India',
        return_pin: parseInt(vendor.pincode),
        seller_name: vendor.name,
        fragile_shipment: false,
        shipment_height: finalHeight,
        shipment_width: finalWidth,
        shipment_length: finalLength,
        cod_amount: mainOrder.payment_method === 'cod' ? vendorOrder.products.reduce((sum, p) => sum + (p.item_cost * (p.quantity || 1)), 0) : 0.0,
        products_desc: productDescriptions.join(', ').substring(0, 100),
        state: mainOrder.shipping_address.state || '',
        dangerous_good: false,
        waybill: '',
        total_amount: vendorOrder.products.reduce((sum, p) => sum + (p.item_cost * (p.quantity || 1)), 0),
        seller_add: vendor.address,
        country: mainOrder.shipping_address.country || 'India',
        plastic_packaging: false,
        quantity: totalQuantity.toString(),
        payment_mode: mainOrder.payment_method === 'cod' ? 'COD' : 'Prepaid',
      }],
      pickup_location: { name: pickupLocationName }
    };

    // Add email if available
    if (user?.email && user.email !== `${user.phoneNumber}_no_email`) {
      shipmentData.shipments[0].email = user.email.trim();
    }

    console.log(`🚚 Creating Delhivery shipment for vendor order: ${vendorOrder.sub_order_id}`);
    console.log(`   Pickup: ${vendor.name} (${pickupLocationName}) | Destination: ${mainOrder.shipping_address.zipCode}`);
    console.log(`   Warehouse Status: ${vendor.warehouse?.status || 'N/A'} | Warehouse ID: ${vendor.warehouse?.delhivery_warehouse_id || 'N/A'}`);

    // Validate critical fields before API call
    if (!pickupLocationName || pickupLocationName.trim().length === 0) {
      throw new Error(`Pickup location name is empty for vendor ${vendor.name}`);
    }

    if (!mainOrder.shipping_address.zipCode || mainOrder.shipping_address.zipCode.length !== 6) {
      throw new Error(`Invalid destination pincode: ${mainOrder.shipping_address.zipCode}`);
    }

    // Create shipment using form-encoded format as required by Delhivery
    const formParams = new URLSearchParams();
    formParams.append('format', 'json');
    formParams.append('data', JSON.stringify(shipmentData));
    const formData = formParams.toString();

    const response = await axios.post(
      `${delhiveryConfig.config.baseUrl}${delhiveryConfig.endpoints.createShipment}`,
      formData,
      {
        headers: delhiveryConfig.getFormAuthHeaders(),
        timeout: delhiveryConfig.config.timeout,
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      }
    );

    console.log(`Delhivery Create Shipment Response Status: ${response.status}`);
    
    const isSuccess = response.data?.success === true || 
                     (Array.isArray(response.data?.packages) && response.data.packages.length > 0);
    
    const waybill = response.data?.packages?.[0]?.waybill;
    const packageInfo = response.data?.packages?.[0];

    if (isSuccess && waybill) {
      console.log(`✅ Delhivery Shipment Created: Vendor Order=${vendorOrder.sub_order_id}, Waybill=${waybill}`);
      return {
        success: true,
        waybill,
        shipmentId: packageInfo?.package_id || packageInfo?.oid || packageInfo?.refnum || null,
        fullResponse: response.data,
      };
    } else {
      const errorMessage = response.data?.remarks || 
                          response.data?.rmk || 
                          response.data?.error ||
                          JSON.stringify(response.data).substring(0, 200);
      
      const errorCode = response.data?.packages?.[0]?.err_code;
      
      console.error(`❌ Delhivery shipment creation failed: ${errorMessage}`);
      if (errorCode) console.error(`Error Code: ${errorCode}`);

      // Handle specific error codes
      if (errorCode === 'ER0005') {
        // Log detailed information for debugging
        console.error(`❌ ER0005 Error Details:`);
        console.error(`   Vendor: ${vendor.name}`);
        console.error(`   Pickup Location: ${pickupLocationName}`);
        console.error(`   Warehouse Status: ${vendor.warehouse?.status || 'N/A'}`);
        console.error(`   Warehouse ID: ${vendor.warehouse?.delhivery_warehouse_id || 'N/A'}`);
        console.error(`   Destination Pincode: ${mainOrder.shipping_address.zipCode}`);
        console.error(`   Full Response:`, JSON.stringify(response.data, null, 2));
        
        throw new Error(
          `Delhivery API Internal Error (ER0005): ${errorMessage}. ` +
          `This usually indicates an issue with your Delhivery account configuration or pickup location setup. ` +
          `Please verify: (1) Pickup location name "${pickupLocationName}" matches exactly (case-sensitive) with the warehouse name registered in Delhivery, ` +
          `(2) Warehouse is properly registered and active, (3) Contact Delhivery support if the issue persists.`
        );
      }

      throw new Error(`Delhivery shipment creation failed: ${errorMessage || 'Unknown error'}`);
    }

  } catch (error) {
    console.error(`❌ Error creating Delhivery shipment for vendor order ${vendorOrder.sub_order_id}:`, error.message);
    
    if (error.response?.status === 401 || error.response?.status === 403) {
      throw new Error('Authentication failed with Delhivery API. Please check your API key.');
    }
    
    if (error.response?.status === 400) {
      const apiErrorMsg = error.response?.data?.error || 
                         error.response?.data?.remarks ||
                         JSON.stringify(error.response?.data).substring(0, 150);
      
      if (typeof apiErrorMsg === 'string' && apiErrorMsg.toLowerCase().includes('clientwarehouse')) {
        throw new Error(
          `Delhivery shipment creation failed: Pickup location "${vendorPickupLocation || 'N/A'}" is not a registered warehouse in your Delhivery account (case-sensitive).`
        );
      }
      
      throw new Error(`Delhivery Shipment API Bad Request: ${apiErrorMsg || error.message}`);
    }

    throw error;
  }
};

/**
 * Create shipments for all vendor orders in an order
 * @param {Object} order - Main order object with vendor_orders array
 * @returns {Promise<Array>} Array of shipment creation results
 */
const createShipmentsForOrder = async (order) => {
  const results = [];

  if (!order.vendor_orders || order.vendor_orders.length === 0) {
    throw new Error('Order has no vendor orders');
  }

  for (const vendorOrder of order.vendor_orders) {
    // Skip if waybill already exists
    if (vendorOrder.waybill_no) {
      results.push({
        sub_order_id: vendorOrder.sub_order_id,
        success: true,
        waybill: vendorOrder.waybill_no,
        message: 'Shipment already exists',
        existing: true,
      });
      continue;
    }

    // Skip manual shipping methods
    if (vendorOrder.shipping_method === 'manual') {
      results.push({
        sub_order_id: vendorOrder.sub_order_id,
        success: false,
        message: 'Manual shipping method - shipment creation skipped',
        skipped: true,
      });
      continue;
    }

    try {
      // Populate vendor details
      const vendor = await Vendor.findById(vendorOrder.vendor_id)
        .select('name address pincode city state country contactNumber email warehouse vendor_delevery_name delhiveryPickupLocationName')
        .lean();

      if (!vendor) {
        throw new Error(`Vendor not found: ${vendorOrder.vendor_id}`);
      }

      // Create shipment for this vendor order
      const shipmentResult = await createDelhiveryShipment(vendorOrder, vendor, order);

      results.push({
        sub_order_id: vendorOrder.sub_order_id,
        success: shipmentResult.success,
        waybill: shipmentResult.waybill,
        message: 'Shipment created successfully',
      });
    } catch (error) {
      console.error(`Failed to create shipment for vendor order ${vendorOrder.sub_order_id}:`, error.message);
      results.push({
        sub_order_id: vendorOrder.sub_order_id,
        success: false,
        error: error.message,
        message: 'Shipment creation failed',
      });
    }
  }

  return results;
};

module.exports = {
  createDelhiveryShipment,
  createShipmentsForOrder,
  calculateVendorOrderWeight,
};

