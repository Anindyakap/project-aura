import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

import { cookies } from 'next/headers';
import {
  clearAuthenticationCookies,
  getSessionToken,
  SESSION_COOKIE_NAME,
} from './sessionCookies';

const cookieStore = {
  get: vi.fn(),
  set: vi.fn(),
};
const mockedCookies = vi.mocked(cookies);

describe('session cookies', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedCookies.mockResolvedValue(cookieStore as never);
  });

  it('expires both authentication cookies during logout', async () => {
    await clearAuthenticationCookies();

    expect(cookieStore.set).toHaveBeenNthCalledWith(
      1,
      SESSION_COOKIE_NAME,
      '',
      expect.objectContaining({ httpOnly: true, maxAge: 0 })
    );
    expect(cookieStore.set).toHaveBeenNthCalledWith(
      2,
      'aura_csrf',
      '',
      expect.objectContaining({ httpOnly: false, maxAge: 0 })
    );
  });

  it('returns the session token when the cookie exists', async () => {
    cookieStore.get.mockReturnValue({ value: 'test-session-token' });

    await expect(getSessionToken()).resolves.toBe('test-session-token');
  });
});
