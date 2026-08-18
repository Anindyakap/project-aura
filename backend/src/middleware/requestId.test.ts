import { NextFunction, Request, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';
import { assignRequestId } from './requestId';

describe('assignRequestId', () => {
  it('adds a UUID to the request and response header', () => {
    const req = {} as Request;
    const setHeader = vi.fn();
    const res = { setHeader } as unknown as Response;
    const next = vi.fn() as unknown as NextFunction;

    assignRequestId(req, res, next);

    expect(req.requestId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
    expect(setHeader).toHaveBeenCalledWith('X-Request-ID', req.requestId);
    expect(next).toHaveBeenCalledOnce();
  });
});
