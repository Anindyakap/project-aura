import { randomUUID } from 'crypto';
import { NextFunction, Request, Response } from 'express';

export const assignRequestId = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const requestId = randomUUID();

  req.requestId = requestId;
  res.setHeader('X-Request-ID', requestId);

  next();
};
