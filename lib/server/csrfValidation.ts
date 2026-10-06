import 'server-only';
import crypto from 'crypto';
import { cookies } from 'next/headers';
import { CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from '../auth/csrf';

const isSameOriginRequest = (request: Request): boolean => {
  const origin = request.headers.get('origin');
  const requestUrl = new URL(request.url);
  const configuredOrigin = process.env.AURA_PUBLIC_ORIGIN;
  const forwardedProtocol = request.headers
    .get('x-forwarded-proto')
    ?.split(',')[0]
    ?.trim();
  const protocol =
    forwardedProtocol === 'http' || forwardedProtocol === 'https'
      ? forwardedProtocol
      : requestUrl.protocol.replace(':', '');
  let requestOrigin = `${protocol}://${requestUrl.host}`;

  if (configuredOrigin) {
    try {
      const publicUrl = new URL(configuredOrigin);
      if (publicUrl.protocol !== 'https:' || configuredOrigin !== publicUrl.origin) {
        return false;
      }
      requestOrigin = publicUrl.origin;
    } catch {
      return false;
    }
  }
  const fetchSite = request.headers.get('sec-fetch-site');

  return origin === requestOrigin && (!fetchSite || fetchSite === 'same-origin');
};

const tokensMatch = (expectedToken: string, receivedToken: string): boolean => {
  const expected = Buffer.from(expectedToken);
  const received = Buffer.from(receivedToken);

  return expected.length === received.length && crypto.timingSafeEqual(expected, received);
};

export const hasTrustedOrigin = (request: Request): boolean => {
  return isSameOriginRequest(request);
};

export const hasValidCsrfRequest = async (request: Request): Promise<boolean> => {
  if (!isSameOriginRequest(request)) {
    return false;
  }

  const cookieStore = await cookies();
  const expectedToken = cookieStore.get(CSRF_COOKIE_NAME)?.value;
  const receivedToken = request.headers.get(CSRF_HEADER_NAME);

  return Boolean(
    expectedToken && receivedToken && tokensMatch(expectedToken, receivedToken)
  );
};
