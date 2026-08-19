import 'server-only';
import crypto from 'crypto';
import { cookies } from 'next/headers';
import { CSRF_COOKIE_NAME } from '../auth/csrf';

export const SESSION_COOKIE_NAME = 'aura_session';

const getCookieSecurityOptions = () => ({
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
});

export const setAuthenticationCookies = async (token: string): Promise<void> => {
  const cookieStore = await cookies();
  const cookieOptions = getCookieSecurityOptions();

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    ...cookieOptions,
    httpOnly: true,
  });

  cookieStore.set(CSRF_COOKIE_NAME, crypto.randomBytes(32).toString('base64url'), {
    ...cookieOptions,
    httpOnly: false,
  });
};

export const clearAuthenticationCookies = async (): Promise<void> => {
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, '', {
    ...getCookieSecurityOptions(),
    httpOnly: true,
    maxAge: 0,
  });

  cookieStore.set(CSRF_COOKIE_NAME, '', {
    ...getCookieSecurityOptions(),
    httpOnly: false,
    maxAge: 0,
  });
};

export const getSessionToken = async (): Promise<string | null> => {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null;
};
