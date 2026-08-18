// src/server.ts
import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { pool } from './config/database';
import { corsOptions } from './config/cors';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/logger';
import { assignRequestId } from './middleware/requestId';
import { logError, logInfo, logWarn } from './utils/logger';
import { getRequiredJwtSecret } from './utils/authConfig';
import authRoutes from './routes/auth.routes';
import cookieParser from 'cookie-parser';
import shopifyRoutes from './routes/shopify.routes';
import brandsRoutes from './routes/brands.routes';
import { registerSyncJobs } from './jobs/sync.jobs';
import syncRoutes from './routes/sync.routes';
import metricsRoutes from './routes/metrics.routes';
import insightsRoutes from './routes/insights.routes';


dotenv.config();
getRequiredJwtSecret(process.env);

const app: Application = express();
app.set('trust proxy', 1);
const PORT = parseInt(process.env.PORT || '4000', 10);
const API_VERSION = process.env.API_VERSION || 'v1';

// ============================================
// MIDDLEWARE
// ============================================
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(assignRequestId);
app.use(requestLogger);
app.use(cookieParser());

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
  // Import at top if not already there
  const { healthCheck } = await import('./config/database');
  
  const dbConnected = await healthCheck();
  
  res.status(200).json({
    status: 'ok',
    message: 'Aura Backend API is running',
    database: dbConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
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
app.use(`/api/${API_VERSION}/integrations/shopify`, shopifyRoutes);
app.use(`/api/${API_VERSION}/brands`, brandsRoutes);
app.use(`/api/${API_VERSION}/sync`, syncRoutes);
app.use(`/api/${API_VERSION}/metrics`, metricsRoutes);
app.use(`/api/${API_VERSION}/insights`, insightsRoutes);



// ============================================
// ERROR HANDLING
// ============================================
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    requestId: req.requestId,
  });
});

app.use(errorHandler);

// ============================================
// START SERVER IMMEDIATELY
// Don't wait for DB - let server start first!
// ============================================
app.listen(PORT, '0.0.0.0', () => {
  logInfo('Server started', {
    environment: process.env.NODE_ENV || 'development',
    port: PORT,
    apiVersion: API_VERSION,
  });

  // Register scheduled jobs (e.g., daily sync)
  registerSyncJobs();

  // Connect to DB after server starts
  connectDatabase();
});

// Try to connect to DB (non-blocking)
const connectDatabase = async (): Promise<void> => {
  let retries = 5;

  while (retries > 0) {
    try {
      const client = await pool.connect();
      await client.query('SELECT NOW()');
      logInfo('Database connected');
      client.release();
      return;
    } catch (error) {
      retries--;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      logWarn('Database connection attempt failed', {
        attempt: 5 - retries,
        remainingRetries: retries,
        errorMessage,
      });

      if (retries === 0) {
        logError('Database connection failed after all retries', {
          errorMessage,
        });
        return; // Don't crash the server!
      }

      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
};

// Graceful shutdown
process.on('SIGTERM', () => {
  logInfo('SIGTERM received, shutting down');
  process.exit(0);
});

process.on('SIGINT', () => {
  logInfo('SIGINT received, shutting down');
  process.exit(0);
});
