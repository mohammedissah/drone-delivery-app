import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';
import path from 'path';
import { fileURLToPath } from 'url';

// Guarantee robust SRV DNS resolution for MongoDB Atlas
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
  // Ignore fallback
}

// Load backend/.env accurately from any directory
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/aerodrop';

export async function connectDB() {
  try {
    const conn = await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 8000
    });
    console.log(`🍃 Connected to MongoDB Atlas Cloud: ${conn.connection.host}/${conn.connection.name}`);
    return true;
  } catch (err) {
    console.warn(`⚠️ MongoDB Atlas connection warning: ${err.message}`);
    console.warn('ℹ️ Running with in-memory state fallback.');
    return false;
  }
}

export function isDbConnected() {
  return mongoose.connection.readyState === 1;
}
