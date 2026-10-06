import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

import { hasTrustedOrigin } from './csrfValidation';

describe('hasTrustedOrigin', () => {
  it('accepts Coolify HTTPS requests forwarded internally over HTTP', () => {
    const request = new Request('http://aura.anindya.nl/api/v1/auth/login', {
      method: 'POST',
      headers: {
        origin: 'https://aura.anindya.nl',
        'x-forwarded-proto': 'https',
        'sec-fetch-site': 'same-origin',
      },
    });

    expect(hasTrustedOrigin(request)).toBe(true);
  });

  it('rejects a request from a different public origin', () => {
    const request = new Request('http://aura.anindya.nl/api/v1/auth/login', {
      method: 'POST',
      headers: {
        origin: 'https://attacker.example',
        'x-forwarded-proto': 'https',
        'sec-fetch-site': 'cross-site',
      },
    });

    expect(hasTrustedOrigin(request)).toBe(false);
  });

  it('continues to accept same-origin local development requests', () => {
    const request = new Request('http://localhost:3000/api/v1/auth/login', {
      method: 'POST',
      headers: {
        origin: 'http://localhost:3000',
        'sec-fetch-site': 'same-origin',
      },
    });

    expect(hasTrustedOrigin(request)).toBe(true);
  });
});
