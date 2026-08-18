import express from 'express';
import { Server } from 'http';
import { AddressInfo } from 'net';
import { afterEach, describe, expect, it } from 'vitest';
import { assignRequestId } from './requestId';
import { createAuthRateLimiter } from './rateLimit';

describe('authentication rate limiter', () => {
  let server: Server | undefined;

  afterEach(async () => {
    await new Promise<void>((resolve, reject) => {
      if (!server) {
        resolve();
        return;
      }

      server.close(error => {
        if (error) reject(error);
        else resolve();
      });
    });
  });

  it('blocks the request after the configured limit', async () => {
    const app = express();
    app.use(assignRequestId);
    app.post('/login', createAuthRateLimiter(2), (_req, res) => {
      res.status(200).json({ success: true });
    });

    server = await new Promise<Server>(resolve => {
      const listeningServer = app.listen(0, '127.0.0.1', () => {
        resolve(listeningServer);
      });
    });
    const { port } = server.address() as AddressInfo;
    const url = `http://127.0.0.1:${port}/login`;

    expect((await fetch(url, { method: 'POST' })).status).toBe(200);
    expect((await fetch(url, { method: 'POST' })).status).toBe(200);

    const blockedResponse = await fetch(url, { method: 'POST' });
    const blockedBody = await blockedResponse.json() as {
      error: boolean;
      message: string;
      requestId: string;
    };

    expect(blockedResponse.status).toBe(429);
    expect(blockedResponse.headers.get('ratelimit')).not.toBeNull();
    expect(blockedBody).toMatchObject({
      error: true,
      message: 'Too many authentication attempts. Please try again later.',
    });
    expect(blockedBody.requestId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
  });
});
