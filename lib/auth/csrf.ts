export const CSRF_COOKIE_NAME = 'aura_csrf';
export const CSRF_HEADER_NAME = 'x-aura-csrf-token';

export const getCsrfToken = (): string | null => {
  if (typeof document === 'undefined') {
    return null;
  }

  const cookiePrefix = `${CSRF_COOKIE_NAME}=`;
  const csrfCookie = document.cookie
    .split('; ')
    .find((cookie) => cookie.startsWith(cookiePrefix));

  return csrfCookie ? decodeURIComponent(csrfCookie.slice(cookiePrefix.length)) : null;
};
