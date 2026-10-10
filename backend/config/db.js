import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/aerodrop';

export async function connectDB() {
  try {
    const conn = await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000 // 5 seconds timeout before fallback
    });
    console.log(`🍃 Connected to MongoDB: ${conn.connection.host}/${conn.connection.name}`);
    return true;
  } catch (err) {
    console.warn(`⚠️ MongoDB connection warning: ${err.message}`);
    console.warn('ℹ️ Running with in-memory state fallback. Real database queries will resume once MongoDB is connected.');
    return false;
  }
}

export function isDbConnected() {
  return mongoose.connection.readyState === 1;
}
