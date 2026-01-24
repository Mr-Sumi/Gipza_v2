const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

/**
 * MongoDB connection configuration
 */
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;

    if (!mongoURI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      
      // Connection Pool Settings
      maxPoolSize: parseInt(process.env.MONGO_MAX_POOL_SIZE) || 10, 
      minPoolSize: parseInt(process.env.MONGO_MIN_POOL_SIZE) || 2, 
      maxIdleTimeMS: 30000, 
      
      // Connection Timeout Settings
      serverSelectionTimeoutMS: 5000, 
      socketTimeoutMS: 45000, 
      connectTimeoutMS: 10000, 
      
      // Retry Settings
      retryWrites: true, 
      retryReads: true, 
      
      // Network Settings
      family: 4, 
      heartbeatFrequencyMS: 10000, 
      
      // Connection Lifecycle
      autoIndex: process.env.NODE_ENV !== 'production', 
      autoCreate: process.env.NODE_ENV !== 'production', 
      
      // Write Concern (ensures data durability)
      w: 'majority', 
      wtimeoutMS: 5000, 
      
      // Read Preference
      readPreference: 'primaryPreferred', 
      
      // Buffering
      bufferCommands: false, 
      maxConnecting: 2, 
    };

    // Connect to MongoDB
    const conn = await mongoose.connect(mongoURI, options);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Connection Pool: Min=${options.minPoolSize}, Max=${options.maxPoolSize}`);
    console.log(`⚙️  Environment: ${process.env.NODE_ENV || 'development'}`);

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });

    mongoose.connection.on('connected', () => {
      console.log('🔗 MongoDB connected');
    });

    mongoose.connection.on('close', () => {
      console.log('📪 MongoDB connection closed');
    });

    // Monitor connection pool events (useful for debugging)
    if (process.env.NODE_ENV === 'development') {
      mongoose.connection.on('all', (event) => {
        console.log(`🔍 MongoDB Event: ${event}`);
      });
    }

    // Handle process termination
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('📪 MongoDB connection closed through app termination');
      process.exit(0);
    });

    return conn;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.error('Please check your MONGODB_URI environment variable');
    
    // Exit process with failure
    process.exit(1);
  }
};
module.exports = {
  connectDB
};

