# Project Aura Environment Variables

This document records variable names only. Do not put real passwords, tokens, connection strings, or other secret values in this file.

## Rules for all environments

- Variables starting with `NEXT_PUBLIC_` are included in browser JavaScript. They are public configuration, never secrets.
- Put local development values in ignored `.env.local` or `backend/.env` files. Start from the matching `.env.example` file.
- Put preview and production values in the Vercel and Render dashboards. Do not commit them to Git.
- A value for a frontend deployment does not automatically become available to the Render backend, or the other way around.

## Frontend variables

| Name | Used by code | Public or secret | Development | Preview | Production | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | Yes, `lib/api.ts` | Public | `.env.local` | Vercel project setting | Vercel project setting | Base URL for browser API requests. |
| `NEXT_PUBLIC_APP_NAME` | No current source reference | Public | Not needed | Not needed | Present in root `.env.production` | Reserved configuration; it currently has no effect. |
| `NEXT_PUBLIC_APP_DESCRIPTION` | No current source reference | Public | Not needed | Not needed | Present in root `.env.production` | Reserved configuration; it currently has no effect. |
| `FRONTEND_URL` (root file) | No current frontend source reference | Public URL, but not a `NEXT_PUBLIC_` variable | Not needed | Not needed | Present in root `.env.production` | This root-file name currently has no frontend effect. It is distinct from the backend `FRONTEND_URL` setting below. |

## Backend variables

| Name | Used by code | Public or secret | Development | Preview | Production | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `PORT` | Yes, `server.ts` | Server setting | `backend/.env` or default `4000` | Render-provided port | Render-provided port | Do not set a public browser value for this. |
| `NODE_ENV` | Yes, server, CORS, and error handling | Server setting | `development` | `production` | `production` | Changes CORS and error-detail behavior. |
| `API_VERSION` | Yes, `server.ts` | Server setting | `v1` or default | Render setting | Render setting | Prefixes API routes. It must match the version in `NEXT_PUBLIC_API_URL`; see `13_API_VERSIONING.md`. |
| `DATABASE_URL` | Yes, database configuration | Secret | `backend/.env` | Render secret setting | Render secret setting | Required to connect to PostgreSQL. |
| `SEED_BRAND_ID` | Yes, development metrics seed script | Development-only identifier | `backend/.env` | Do not set | Do not set | UUID for the disposable development brand whose metrics are replaced. Never use a production brand. |
| `SEED_INTEGRATION_ID` | Yes, development metrics seed script | Development-only identifier | `backend/.env` | Do not set | Do not set | UUID for the disposable development Shopify integration. Never use a production integration. |
| `ALLOW_METRICS_SEED` | Yes, development metrics seed script | Development-only safety switch | `true` only while intentionally seeding | Do not set | Do not set | The script refuses to run unless this exact value is `true`. Reset it to `false` afterward. |
| `JWT_SECRET` | Yes, authentication utility and backend startup validation | Secret | `backend/.env` | Render secret setting | Render secret setting | Required in every environment. Use a long random value; Aura has no code fallback. |
| `JWT_EXPIRES_IN` | Yes, authentication utility | Server setting | `backend/.env` or default `7d` | Render setting | Render setting | JWT lifetime such as `7d`. |
| `FRONTEND_URL` (backend) | Yes, CORS and Shopify redirect | Public URL | `backend/.env` | Render setting | Render setting | Exact allowed frontend origin, including protocol. |
| `VERCEL_URL` | Yes, CORS configuration | Public hostname | Optional in `backend/.env` | Optional Render setting | Usually not needed | Enter a hostname without `https://`; the backend adds that protocol. Render does not receive Vercel variables automatically. |
| `SHOPIFY_CLIENT_ID` | Yes, Shopify OAuth controller | Sensitive application identifier | `backend/.env` | Render secret setting | Render secret setting | Required before using Shopify OAuth. |
| `SHOPIFY_CLIENT_SECRET` | Yes, Shopify OAuth controller | Secret | `backend/.env` | Render secret setting | Render secret setting | Never expose this to the frontend. |
| `SHOPIFY_REDIRECT_URI` | Yes, Shopify OAuth controller | Public URL | `backend/.env` | Render setting | Render setting | Must exactly match the redirect URI registered in Shopify. |

## Deployment configuration checked in the repository

`render.yaml` declares `NODE_ENV`, `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `FRONTEND_URL`, and `API_VERSION` for the production backend. Shopify OAuth names are read by source code but are not declared in that file, so they must be added in Render before Shopify OAuth is used in a deployed environment.

There is no checked-in Vercel configuration file. The repository can confirm the frontend variable name used by code, but not the actual Vercel dashboard values for preview or production.

## Beginner verification

1. Copy `.env.example` to `.env.local` for frontend development, or copy `backend/.env.example` to `backend/.env` for backend development.
2. Replace only local placeholders; never paste a real production secret into an example file.
3. Run the frontend and backend locally.
4. If the browser cannot call the backend, check that frontend `NEXT_PUBLIC_API_URL` and backend `FRONTEND_URL` point to the correct local addresses.
