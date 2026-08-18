import { afterEach, describe, expect, it, vi } from 'vitest';
import { getSafePath, logInfo } from './logger';

describe('getSafePath', () => {
  it('removes query parameters from a request URL', () => {
    expect(getSafePath('/connect?token=secret-token')).toBe('/connect');
  });
});

describe('logInfo', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('writes a JSON log entry with safe context', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    logInfo('Request completed', {
      method: 'GET',
      path: getSafePath('/api/v1/brands?token=secret-token'),
      statusCode: 200,
    });

    const output = logSpy.mock.calls[0][0];
    const entry = JSON.parse(output) as Record<string, unknown>;

    expect(entry).toMatchObject({
      level: 'info',
      message: 'Request completed',
      method: 'GET',
      path: '/api/v1/brands',
      statusCode: 200,
    });
    expect(entry.path).not.toContain('token=');
  });
});
