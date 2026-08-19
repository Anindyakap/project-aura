# Authentication Token Storage Decision

## Status

Implementation completed locally on August 19, 2026. Aura now uses a same-origin Next.js proxy and HTTP-only session cookies in the source code. Migration 003 was applied and verified in Supabase on August 19, 2026. The rollout remains incomplete until the Vercel environment value and deployed browser checks are completed.

## Current implementation

After login or registration, the backend returns a JWT only to a Next.js route handler. That route handler stores the JWT in an HTTP-only `aura_session` cookie and returns the user object without the token.

The browser calls same-origin `/api/v1/...` proxy routes. Next.js reads the session cookie server-side and adds `Authorization: Bearer <token>` only when forwarding requests to the backend.

## Options considered

### Same-origin Next.js proxy

The browser sends requests to the Next.js site, not directly to Render. This avoids third-party cookies while keeping the JWT unreadable to browser JavaScript.

The proxy requires a matching CSRF cookie/header and a same-origin request for state-changing methods. Shopify OAuth uses a one-time hashed state record in the database rather than a backend-domain browser cookie.

## Decision

Use the same-origin Next.js proxy. The source code includes CSRF protection, production HTTPS cookie settings, logout cookie clearing, backend OAuth-state tests, and no browser JWT URL parameter.

Before deployment, configure Vercel's server-only `BACKEND_API_URL`, apply the Supabase migration, and verify the complete browser flow.

## Security notes

- Never put JWTs in URLs, logs, source code, documentation, or API-test files.
- The session cookie is HTTP-only, but XSS defenses and the Content Security Policy still matter.
- Cookie migration is not complete until supported browsers can authenticate reliably and state-changing requests have CSRF protection.

## Related checklist task

See `01_MASTER_CHECKLIST.md`: "Complete the HTTP-only-cookie migration."
