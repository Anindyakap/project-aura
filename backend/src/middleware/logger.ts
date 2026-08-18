// src/middleware/logger.ts
// Request logging middleware

import { Request, Response, NextFunction } from 'express';
import { getSafePath, logError, logInfo, logWarn } from '../utils/logger';

export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const startTime = Date.now();

  // Log when response finishes
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const method = req.method;
    const path = getSafePath(req.originalUrl || req.url);
    const status = res.statusCode;

    const context = {
      requestId: req.requestId,
      method,
      path,
      statusCode: status,
      durationMs: duration,
    };

    if (status >= 500) {
      logError('Request completed with server error', context);
    } else if (status >= 400) {
      logWarn('Request completed with client error', context);
    } else {
      logInfo('Request completed', context);
    }
  });

  next();
};
