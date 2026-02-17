// src/config/database.ts
// Database connection configuration using pg (node-postgres)

import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Validate DATABASE_URL exists
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not defined');
}

// Create PostgreSQL connection pool
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Test database connection with retry logic
export const testConnection = async (): Promise<void> => {
  let retries = 3;

  while (retries > 0) {
    try {
      const client = await pool.connect();
      const result = await client.query('SELECT NOW()');
      console.log('✅ Database connected successfully at:', result.rows[0].now);
      client.release();
      return;
    } catch (error) {
      retries--;
      console.error(`❌ Database connection error (attempt ${3 - retries}/3):`, error);

      if (retries === 0) {
        throw error;
      }

      console.log(`⏳ Retrying in 2 seconds... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
};

// Handle pool errors gracefully
pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err);
});

// Graceful shutdown
export const closePool = async (): Promise<void> => {
  await pool.end();
  console.log('Database pool closed');
};