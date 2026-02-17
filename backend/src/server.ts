// src/server.ts
import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { pool } from './config/database';
import { corsOptions } from './config/cors';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/logger';
import authRoutes from './routes/auth.routes';

dotenv.config();

const app: Application = express();
const PORT = parseInt(process.env.PORT || '4000', 10);
const API_VERSION = process.env.API_VERSION || 'v1';

// ============================================
// MIDDLEWARE
// ============================================
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(requestLogger);

// Security headers
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// ============================================
// ROUTES
// ============================================
app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    message: 'Welcome to Aura API',
    version: '1.0.0',
  });
});

app.get('/health', async (_req: Request, res: Response) => {
  // Test DB connection on health check
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    res.status(200).json({
      status: 'ok',
      message: 'Aura Backend API is running',
      database: 'connected',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    });
  } catch (error) {
    res.status(200).json({
      status: 'ok',
      message: 'Aura Backend API is running',
      database: 'disconnected',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    });
  }
});

app.get(`/api/${API_VERSION}`, (_req: Request, res: Response) => {
  res.status(200).json({
    message: `Aura API ${API_VERSION}`,
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: `/api/${API_VERSION}/auth`,
      brands: `/api/${API_VERSION}/brands`,
      integrations: `/api/${API_VERSION}/integrations`,
      metrics: `/api/${API_VERSION}/metrics`,
      insights: `/api/${API_VERSION}/insights`,
    },
  });
});

// ============================================
// API ROUTES
// ============================================
app.use(`/api/${API_VERSION}/auth`, authRoutes);

// ============================================
// ERROR HANDLING
// ============================================
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
  });
});

app.use(errorHandler);

// ============================================
// START SERVER IMMEDIATELY
// Don't wait for DB - let server start first!
// ============================================
app.listen(PORT, '0.0.0.0', () => {
  console.log('╔════════════════════════════════════════╗');
  console.log('║  🚀 Aura Backend API Server Running   ║');
  console.log('╠════════════════════════════════════════╣');
  console.log(`║  Environment: ${(process.env.NODE_ENV || 'development').padEnd(24)} ║`);
  console.log(`║  Port: ${PORT.toString().padEnd(31)} ║`);
  console.log(`║  API Version: ${(API_VERSION).padEnd(24)} ║`);
  console.log('╚════════════════════════════════════════╝');

  // Connect to DB after server starts
  connectDatabase();
});

// Try to connect to DB (non-blocking)
const connectDatabase = async (): Promise<void> => {
  let retries = 5;

  while (retries > 0) {
    try {
      const client = await pool.connect();
      const result = await client.query('SELECT NOW()');
      console.log('✅ Database connected at:', result.rows[0].now);
      client.release();
      return;
    } catch (error) {
      retries--;
      console.error(`❌ DB connection failed (${5 - retries}/5):`, error);

      if (retries === 0) {
        console.error('💀 Could not connect to database after 5 attempts');
        return; // Don't crash the server!
      }

      console.log(`⏳ Retrying in 3 seconds... (${retries} left)`);
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
};

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down...');
  process.exit(0);
});