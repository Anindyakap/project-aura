import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  clearAuthenticationCookies: vi.fn(),
  hasValidCsrfRequest: vi.fn(),
}));

vi.mock('@/lib/server/csrfValidation', () => ({
  hasValidCsrfRequest: mocks.hasValidCsrfRequest,
}));
vi.mock('@/lib/server/sessionCookies', () => ({
  clearAuthenticationCookies: mocks.clearAuthenticationCookies,
}));

import { POST } from './route';

describe('POST /api/v1/auth/logout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects logout when the CSRF request is invalid', async () => {
    mocks.hasValidCsrfRequest.mockResolvedValue(false);

    const response = await POST(new Request('http://aura.test/api/v1/auth/logout'));

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: true,
      message: 'Invalid CSRF request',
    });
    expect(mocks.clearAuthenticationCookies).not.toHaveBeenCalled();
  });

  it('clears cookies when the CSRF request is valid', async () => {
    mocks.hasValidCsrfRequest.mockResolvedValue(true);

    const response = await POST(new Request('http://aura.test/api/v1/auth/logout'));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      message: 'Logged out successfully',
    });
    expect(mocks.clearAuthenticationCookies).toHaveBeenCalledTimes(1);
  });
});
