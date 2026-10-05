# Coolify Production Migration

## Setup

- [x] Confirm the remote Coolify server is healthy and its proxy is running.
- [x] Confirm Cloudflare wildcard routing makes Aura subdomains available.
- [ ] Keep Vercel and Render available as rollback services until production verification passes.

## Backend

- [x] Add a validated `SCHEDULED_JOBS_ENABLED` setting with a disabled-by-default value.
- [ ] Deploy the Coolify backend with scheduled jobs disabled and verify `/health`.

## Frontend

- [ ] Deploy the frontend to `aura.anindya.nl` using the Coolify backend URL.
- [ ] Verify login, dashboard, refresh, and logout.

## Security

- [ ] Add production secrets only through Coolify environment variables.
- [ ] Verify HTTPS for `aura.anindya.nl` and `api.anindya.nl`.
- [ ] Keep `RESEND_API_KEY` server-only.

## Tests

- [ ] Run lint, type checks, unit tests, builds, and production smoke tests.
- [ ] Confirm exactly one backend has scheduled jobs enabled.

## Cutover

- [ ] Configure `aura.anindya.nl` and `api.anindya.nl` in Coolify.
- [ ] Update Shopify callback and allowed URLs.
- [ ] Stop Render and enable scheduled jobs in Coolify.
- [ ] Verify the live production flow.

## Documentation and cleanup

- [ ] Document the final Coolify deployment and rollback procedure.
- [ ] Remove old hosting only after stable verification.
