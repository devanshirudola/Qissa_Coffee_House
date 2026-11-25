import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve __dirname for ES modules
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Connect to MongoDB.
 * In test environment, uses an in‑memory server to avoid external dependencies.
 */
export async function connectDatabase() {
  let uri = process.env.MONGODB_URI;

  if (process.env.NODE_ENV === 'test') {
    // Attempt to start an in‑memory MongoDB server.
    const cacheDir = path.resolve(__dirname, '../../.mongocache');
    try { fs.mkdirSync(cacheDir, { recursive: true }); } catch { /* ignore */ }
    process.env.MONGOMS_DOWNLOAD_DIR = cacheDir;
    let mongod;
    try {
      mongod = await MongoMemoryServer.create({
        binary: { downloadDir: process.env.MONGOMS_DOWNLOAD_DIR },
        instance: { storageEngine: 'ephemeralForTest' }
      });
      uri = mongod.getUri();
      process.env.__MONGOD_INSTANCE = mongod;
    } catch (e) {
      console.warn('MongoMemoryServer failed (likely no internet). Falling back to a local MongoDB instance.');
      // Expect a local MongoDB running; use a test‑only URI if provided, otherwise default.
      const fallbackUri = process.env.LOCAL_TEST_MONGODB_URI || 'mongodb://127.0.0.1:27017/qissa_test';
      uri = fallbackUri;
    }
  }

  if (!uri) throw new Error('MONGODB_URI is not configured');

  // Connection event listeners – log without exposing credentials
  mongoose.connection.on('connected', () => console.info('MongoDB connected'));
  mongoose.connection.on('error', (error) => console.error('MongoDB connection error:', error.message));
  mongoose.connection.on('disconnected', () => console.warn('MongoDB disconnected'));
  mongoose.connection.on('reconnected', () => console.info('MongoDB reconnected'));
  mongoose.connection.on('close', () => console.warn('MongoDB connection closed'));

  await mongoose.connect(uri, {
    // Minimal options; defaults are sufficient for both real and in‑memory servers.
  });
}
