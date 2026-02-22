// src/config/database.ts
// Database connection configuration using pg (node-postgres)

import { Pool, PoolClient } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not defined');
}

// Create pool with better error handling
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000, // Increased from 5000
  // Automatically reconnect when connection is lost
  allowExitOnIdle: false,
});

// Track connection state
let isConnected = false;

// Test and maintain connection
export const testConnection = async (): Promise<void> => {
  let retries = 5;

  while (retries > 0) {
    try {
      const client = await pool.connect();
      const result = await client.query('SELECT NOW()');
      console.log('✅ Database connected at:', result.rows[0].now);
      client.release();
      isConnected = true;
      return;
    } catch (error) {
      retries--;
      isConnected = false;
      console.error(`❌ DB connection failed (${5 - retries}/5):`, error);

      if (retries === 0) {
        console.error('💀 Could not connect after 5 attempts. Will retry on next request.');
        return; // Don't crash - let app run
      }

      console.log(`⏳ Retrying in 3 seconds... (${retries} left)`);
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
};

// Get connection with auto-retry
export const getConnection = async (): Promise<PoolClient> => {
  try {
    return await pool.connect();
  } catch (error) {
    console.log('⚠️ Connection failed, attempting to reconnect...');
    await testConnection();
    return await pool.connect();
  }
};

// Health check that reconnects if needed
export const healthCheck = async (): Promise<boolean> => {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    isConnected = true;
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    isConnected = false;
    // Try to reconnect in background
    testConnection().catch(() => {});
    return false;
  }
};

// Handle pool errors
pool.on('error', (err) => {
  console.error('❌ Unexpected database error:', err);
  isConnected = false;
  // Auto-reconnect on error
  testConnection().catch(() => {});
});

// Graceful shutdown
export const closePool = async (): Promise<void> => {
  await pool.end();
  console.log('Database pool closed');
};

// Check if connected
export const isPoolConnected = (): boolean => {
  return isConnected;
};
