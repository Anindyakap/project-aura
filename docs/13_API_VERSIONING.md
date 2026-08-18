# API Versioning

## Current behavior

Aura currently exposes one API route version at a time. The backend reads
`API_VERSION` from its environment and defaults to `v1`.

With `API_VERSION=v1`, versioned API routes begin with:

```text
/api/v1
```

Examples:

```text
POST /api/v1/auth/login
GET  /api/v1/brands
GET  /api/v1/metrics/summary
```

`GET /api/v1` is the API index route. It returns the current route groups.

The root route (`/`) and health route (`/health`) are intentionally
unversioned.

## Frontend and backend configuration

The frontend sends requests to `NEXT_PUBLIC_API_URL`. Its value must include
the same version prefix that the backend serves.

For local development, the matching values are:

```text
# backend/.env
API_VERSION=v1

# .env.local
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
```

If these values do not match, the frontend will request routes that the
backend does not serve and receive a 404 response.

## What the versions mean

The `v1` URL segment is the API contract version. It is separate from Aura's
application version (`1.0.0`), which appears in the API index response.

Use a new API version only for a breaking change, such as removing or
renaming an endpoint, changing required request fields, or changing the shape
of a response in a way existing frontend code cannot use.

Adding a new optional response field or a new endpoint normally does not
require a new API version.

## Current limitation

Aura currently serves one configured version at a time. Setting
`API_VERSION=v2` moves the existing routes from `/api/v1/...` to
`/api/v2/...`; it does not make both versions available.

Do not change the production `API_VERSION` value to create a new version
until Aura has code that explicitly mounts and tests both route versions.

## Future breaking-change process

1. Decide whether the change is truly breaking.
2. Keep the existing `v1` routes available.
3. Add separate `v2` routes and tests.
4. Update the frontend to use `/api/v2` only after `v2` is ready.
5. Deploy the backend with both versions, then deploy the frontend.
6. Announce a deprecation period for `v1`.
7. Remove `v1` only after its consumers have migrated.

API versioning organizes URLs; it does not replace authentication,
authorization, input validation, or rate limiting.
