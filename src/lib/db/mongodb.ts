// MongoDB / Mongoose Connection Layer for Next.js Server-Side
// Follows Next.js singleton connection pooling & prevents multiple connections across hot-reloads

import mongoose from 'mongoose';
import dns from 'node:dns';

// Fix Node.js SRV resolution issue on Windows / ISP DNS (querySrv ECONNREFUSED)
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
  // Ignore in case environment restricts custom DNS servers
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

// Global cached connection for serverless / dev hot-reload environments
let cached = globalThis.mongooseCache;

if (!cached) {
  cached = globalThis.mongooseCache = { conn: null, promise: null };
}

/**
 * Connect to MongoDB with connection pooling
 * Strictly server-side only; MONGODB_URI is not exposed to client bundles
 */
export async function connectToDatabase(): Promise<typeof mongoose> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      'MONGODB_URI is not defined in environment variables (.env.local). Please set MONGODB_URI.'
    );
  }

  if (cached!.conn) {
    return cached!.conn;
  }

  if (!cached!.promise) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      dbName: 'hacktober2026',
    };

    cached!.promise = mongoose.connect(uri, opts).then((mongooseInstance) => {
      return mongooseInstance;
    });
  }

  try {
    cached!.conn = await cached!.promise;
  } catch (error) {
    cached!.promise = null;
    throw error;
  }

  return cached!.conn;
}

/**
 * Check if MongoDB connection is currently active
 */
export function isMongoConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

export default connectToDatabase;
