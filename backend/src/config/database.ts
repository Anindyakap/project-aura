// src/config/database.ts
// Database connection configuration using pg (node-postgres)

import { Pool, PoolClient } from 'pg';
import dotenv from 'dotenv';
import { logError, logInfo, logWarn } from '../utils/logger';

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
      await client.query('SELECT NOW()');
      logInfo('Database connection established');
      client.release();
      isConnected = true;
      return;
    } catch (error) {
      retries--;
      isConnected = false;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      logWarn('Database connection attempt failed', {
        attempt: 5 - retries,
        remainingRetries: retries,
        errorName: error instanceof Error ? error.name : 'UnknownError',
        errorMessage,
      });

      if (retries === 0) {
        logError('Database connection failed after all retries', {
          errorName: error instanceof Error ? error.name : 'UnknownError',
          errorMessage,
        });
        return; // Don't crash - let app run
      }

      logInfo('Database connection retry scheduled', {
        remainingRetries: retries,
      });
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
};

// Get connection with auto-retry
export const getConnection = async (): Promise<PoolClient> => {
  try {
    return await pool.connect();
  } catch (error) {
    logWarn('Database connection unavailable; attempting reconnect', {
      errorName: error instanceof Error ? error.name : 'UnknownError',
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    });
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
    logError('Database health check failed', {
      errorName: error instanceof Error ? error.name : 'UnknownError',
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    });
    isConnected = false;
    // Try to reconnect in background
    testConnection().catch(() => {});
    return false;
  }
};

// Handle pool errors
pool.on('error', (err) => {
  logError('Unexpected database pool error', {
    errorName: err.name,
    errorMessage: err.message,
  });
  isConnected = false;
  // Auto-reconnect on error
  testConnection().catch(() => {});
});

// Graceful shutdown
export const closePool = async (): Promise<void> => {
  await pool.end();
  logInfo('Database pool closed');
};

// Check if connected
export const isPoolConnected = (): boolean => {
  return isConnected;
};
