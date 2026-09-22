// Test script for MongoDB connection pooling and connectivity
import fs from 'node:fs';
import path from 'node:path';

// Load .env.local if not already set
if (!process.env.MONGODB_URI) {
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
    for (const line of lines) {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^["'](.*)["']$/, '$1');
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  }
}

import { connectToDatabase, isMongoConnected } from '../src/lib/db/mongodb';
import mongoose from 'mongoose';

async function testConnection() {
  console.log('Testing MongoDB connection layer...');
  console.log('Environment MONGODB_URI configured:', !!process.env.MONGODB_URI);

  try {
    const conn = await connectToDatabase();
    console.log('✓ Successfully connected to MongoDB cluster!');
    console.log('✓ Connection state (1=connected):', conn.connection.readyState);
    console.log('✓ Database name:', conn.connection.name || 'default');
    console.log('✓ isMongoConnected helper:', isMongoConnected());

    // Test connection pooling: calling connectToDatabase() again should return cached instance
    const cachedConn = await connectToDatabase();
    console.log('✓ Connection pooling verified (same instance):', conn === cachedConn);

    await mongoose.disconnect();
    console.log('✓ Disconnected cleanly.');
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('✗ MongoDB connection failed with error:');
    console.error(errorMsg);
    process.exit(1);
  }
}

testConnection();
