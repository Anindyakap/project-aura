// src/server.ts
// Main Express server entry point

import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { testConnection } from './config/database';
import { corsOptions } from './config/cors';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/logger';
import authRoutes from './routes/auth.routes';

// Load environment variables
dotenv.config();

// Create Express app
const app: Application = express();
const PORT = parseInt(process.env.PORT || '4000', 10);
const API_VERSION = process.env.API_VERSION || 'v1';

// ============================================
// MIDDLEWARE
// ============================================

// CORS configuration
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' })); // Parse JSON bodies (max 10MB)
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Parse URL-encoded bodies

// Request logging
app.use(requestLogger);

// Security headers (basic)
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// ============================================
// ROUTES
// ============================================

// Root endpoint
app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    message: 'Welcome to Aura API',
    version: '1.0.0',
    documentation: `/api/${API_VERSION}`,
  });
});

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    message: 'Aura Backend API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
  });
});

// API version route
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
    status: 'All endpoints coming soon',
  });
});

// ============================================
// API ROUTES
// ============================================

app.use(`/api/${API_VERSION}/auth`, authRoutes);

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler - Route not found
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    availableEndpoints: {
      health: '/health',
      api: `/api/${API_VERSION}`,
    },
  });
});

// Global error handler (must be last)
app.use(errorHandler);

// ============================================
// SERVER STARTUP
// ============================================

const startServer = async () => {
  try {
    // Test database connection
    await testConnection();
    
    // Start Express server
    // Start Express server
app.listen(PORT, '0.0.0.0', () => {
  console.log('╔════════════════════════════════════════╗');
  console.log('║  🚀 Aura Backend API Server Running   ║');
  console.log('╠════════════════════════════════════════╣');
  console.log(`║  Environment: ${(process.env.NODE_ENV || 'development').padEnd(24)} ║`);
  console.log(`║  Port: ${PORT.toString().padEnd(31)} ║`);
  console.log(`║  API Version: ${(process.env.API_VERSION || 'v1').padEnd(24)} ║`);
  console.log(`║  URL: http://localhost:${PORT.toString().padEnd(18)} ║`);
  console.log('╠════════════════════════════════════════╣');
  console.log('║  📚 Endpoints:                         ║');
  console.log(`║    - GET  /health                      ║`);
  console.log(`║    - GET  /api/v1                      ║`);
  console.log('╚════════════════════════════════════════╝');
});

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\nSIGINT received, shutting down gracefully...');
  process.exit(0);
});
