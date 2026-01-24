require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

/**
 * Admin User Seeder
 * Creates a default admin user if it doesn't exist
 */
const seedAdminUser = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Admin user configuration
    const adminData = {
      phoneNumber: process.env.ADMIN_PHONE_NUMBER || '9999999999',
      name: process.env.ADMIN_NAME || 'Admin User',
      email: process.env.ADMIN_EMAIL || 'admin@gipza.com',
      password: process.env.ADMIN_PASSWORD || 'Admin@123',
      role: 'admin',
    };

    // Check if admin already exists
    const existingAdmin = await User.findOne({ 
      $or: [
        { phoneNumber: adminData.phoneNumber },
        { email: adminData.email },
        { role: 'admin' }
      ]
    });

    if (existingAdmin) {
      console.log('⚠️  Admin user already exists:');
      console.log(`   Phone: ${existingAdmin.phoneNumber}`);
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Role: ${existingAdmin.role}`);
      
      // Update role if it's not admin
      if (existingAdmin.role !== 'admin') {
        existingAdmin.role = 'admin';
        await existingAdmin.save();
        console.log('✅ Updated user role to admin');
      }
      
      // Update password if provided via env
      if (process.env.ADMIN_PASSWORD && existingAdmin.password) {
        const bcrypt = require('bcryptjs');
        const isPasswordMatch = await bcrypt.compare(process.env.ADMIN_PASSWORD, existingAdmin.password);
        if (!isPasswordMatch) {
          existingAdmin.password = process.env.ADMIN_PASSWORD;
          await existingAdmin.save();
          console.log('✅ Updated admin password');
        }
      }
      
      await mongoose.connection.close();
      console.log('✅ Seeder completed');
      return;
    }

    // Create new admin user
    const admin = new User(adminData);
    await admin.save();

    console.log('✅ Admin user created successfully:');
    console.log(`   Phone: ${admin.phoneNumber}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Name: ${admin.name}`);
    console.log(`   Role: ${admin.role}`);
    console.log(`   Password: ${adminData.password} (hashed)`);
    console.log('');
    console.log('📝 Login Credentials:');
    console.log(`   Phone: ${adminData.phoneNumber}`);
    console.log(`   Password: ${adminData.password}`);
    console.log(`   OTP (for hardcoded number): 123456`);

    await mongoose.connection.close();
    console.log('✅ Seeder completed');
  } catch (error) {
    console.error('❌ Error seeding admin user:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run seeder if called directly
if (require.main === module) {
  seedAdminUser();
}

module.exports = seedAdminUser;

