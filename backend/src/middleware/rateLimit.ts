import { rateLimit } from 'express-rate-limit';

const FIFTEEN_MINUTES_IN_MS = 15 * 60 * 1000;
const AUTH_REQUEST_LIMIT = 10;

export const createAuthRateLimiter = (limit: number = AUTH_REQUEST_LIMIT) => {
  return rateLimit({
    windowMs: FIFTEEN_MINUTES_IN_MS,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        error: true,
        message: 'Too many authentication attempts. Please try again later.',
        requestId: req.requestId,
      });
    },
  });
};

export const authRateLimiter = createAuthRateLimiter();
