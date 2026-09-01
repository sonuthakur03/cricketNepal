// config/db.js
// Handles MongoDB Atlas connection with automatic retry

const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cricketnepal';
  
  const connectWithRetry = async () => {
    try {
      const conn = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
      });
      console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
      console.error(`❌ MongoDB Connection Error (${error.message}). Retrying in 5 seconds...`);
      setTimeout(connectWithRetry, 5000);
    }
  };

  // Handle connection events
  mongoose.connection.on('error', (err) => {
    console.error(`❌ MongoDB connection error: ${err.message || err}`);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️  MongoDB disconnected. Attempting to reconnect...');
  });

  await connectWithRetry();
};

module.exports = connectDB;
