# Project Aura — What Has Been Built So Far

## 1. Product purpose

Project Aura is a cloud-hosted growth intelligence application for direct-to-consumer brands. Its purpose is not merely to display marketing and sales data, but to combine data, calculate meaningful metrics, identify changes, and produce plain-language recommendations.

The intended long-term product connects Shopify, Meta Ads, and Google Ads. The supplied documentation shows that the Shopify foundation, metrics dashboard, and rules-based insights system have already been built, while Meta Ads and Google Ads remain future work.

## 2. Current architecture

Aura uses three main layers:

1. **Frontend:** Next.js and TypeScript, deployed on Vercel.
2. **Backend:** Node.js, Express, and TypeScript, deployed on Render.
3. **Database:** PostgreSQL hosted by Supabase.

The normal request flow is:

```text
User action
  → frontend state or API request
  → Express route and middleware
  → controller or service logic
  → PostgreSQL query
  → JSON response
  → frontend state update
  → screen re-render
```

## 3. Completed foundation

The cloud infrastructure is in place: GitHub stores the code, Vercel deploys the frontend, Render deploys the backend, and Supabase stores persistent data. The frontend was initialized with Next.js, TypeScript, Tailwind CSS v4, and Shadcn/UI. The backend uses Express with CORS, JSON parsing, request logging, security headers, centralized errors, and a health endpoint.

## 4. Database model

The documented database includes five central tables:

- `users`: application accounts and password hashes.
- `brands`: stores or businesses owned by a user.
- `integrations`: connected external platforms such as Shopify.
- `metrics`: daily metric values, separated by type and brand.
- `insights`: generated recommendations and read/unread status.

Constraints and triggers reduce duplicate data and keep timestamps current.

## 5. Authentication

Aura supports registration, login, and current-user validation. Passwords are hashed with bcrypt. Successful authentication creates a JWT. Protected backend routes verify that token before executing. An authentication context keeps the logged-in user available across the frontend.

A special flexible-authentication variation is documented for the Shopify redirect flow because a browser navigation cannot attach a normal custom authorization header.

## 6. Dashboard experience

The dashboard includes a persistent responsive layout, a collapsible desktop sidebar, a mobile slide-in menu, a sticky header, user information, and logout. It supports light and dark themes and stores the theme preference in the browser.

The overview page shows four KPIs:

- Revenue
- Orders
- Average Order Value
- New Customers

It also shows percentage changes and a 30-day area chart. Dashboard requests are sent in parallel with `Promise.all`, reducing wait time compared with sequential loading.

## 7. Shopify integration

The documented Shopify integration implements the OAuth 2.0 sequence:

1. Validate the shop and brand.
2. Create a random state value for CSRF protection.
3. Redirect the user to Shopify.
4. Verify state and HMAC when Shopify redirects back.
5. Exchange a temporary authorization code for an access token.
6. Fetch store information.
7. Store or update the integration.
8. Redirect the user back to Aura.

The project also has a disconnect flow and status display. The manual notes that protected customer-data approval was pending, so realistic seed data was used for the demonstration.

## 8. Data ingestion and metrics

A scheduled job runs daily. It obtains connected Shopify integrations, fetches paginated paid orders, calculates daily revenue, order count, and new customers, and saves those values with UPSERT logic. A manual synchronization endpoint also exists.

The metrics API calculates summaries, period-over-period changes, and chart points. AOV is calculated as revenue divided by order count.

## 9. Insights engine

The insights engine compares the most recent seven days with the preceding seven days and applies six documented rules:

- Revenue drop
- Revenue spike
- Order-volume drop
- AOV improvement
- New-customer drop
- All metrics growing

It creates plain-language insight records, prevents duplicate same-day insight types, and removes old insights. The frontend can load insights, mark one as read, mark all as read, refresh the list, and show unread badges.

## 10. Portfolio work

The supplied checklist says that a case study, resume bullets, LinkedIn draft, GitHub README, interview answers, and key statistics were already prepared. Before publishing them, every claim should be verified against the current repository and production application.

## 11. Major work still remaining

The largest unfinished areas are:

- Meta Ads OAuth and campaign data
- Google Ads OAuth and campaign data
- Campaign deep-dive pages
- Webhook delivery for Zapier or Make
- User-configurable settings and thresholds
- Automated tests
- Monitoring and CI/CD
- A complete security and documentation audit

## 12. Important technical risks to review

- Test credentials must not be published.
- Aura uses a same-origin Next.js proxy design: browser JavaScript no longer receives the JWT, and Next.js stores it in an HTTP-only session cookie before forwarding protected requests to the backend. CSRF checks protect state-changing proxy requests. Migration `003_add_shopify_oauth_states.sql` was applied and verified in Supabase on August 19, 2026. Production verification passed on August 20, 2026: login, refresh, logout, protected-route redirect, and Shopify OAuth with a development store.
- OAuth access tokens should be encrypted at rest.
- API versions and platform policies can change and should be rechecked before implementing the remaining integrations.
- The current documentation must be compared with the actual repository because manual documents can become outdated.

## 13. Git secret-history audit

On July 17, 2026, the reachable Git history was scanned with redacted secret-pattern checks. The audit examined 33 reachable commits and found no candidate files containing common secret assignments, connection strings, or private-key markers. A later redacted source audit found a JWT-shaped bearer token in `backend/api-tests.http` and reachable Git history, plus a JWT-secret fallback in backend source. The bearer token had expired before this finding and was removed from the current test file. On August 18, 2026, the code fallback was removed, the backend was changed to require a non-blank `JWT_SECRET` at startup, and the deployed Render secret was rotated. A new production login and refresh succeeded. Before cleanup, a complete private Git bundle backup was created and verified outside the repository. The historical exposure still requires a separate, coordinated Git-history rewrite, so the checklist item remains open. The tracked `.env.production` file contains public frontend configuration names only; values were not recorded in this documentation.

## 14. Environment configuration templates

The repository includes `.env.example` and `backend/.env.example` templates. They list the frontend API URL and the backend server, database, authentication, browser URL, and Shopify OAuth variable names with non-secret placeholder values. Developers copy the relevant template to a local ignored `.env` file and replace placeholders using their own environment settings; example files must never receive real credentials.

## 15. Local application font

The frontend bundles the Inter variable font in `app/fonts/` and loads it with Next.js `next/font/local`. Production builds therefore do not need to fetch Google Fonts. The bundled Inter license is stored beside the font file.

## 16. Backend automated-test foundation

The backend uses Vitest 3.2.7, selected because it supports the backend's declared Node 18+ runtime. `npm test` runs the test suite once. It covers validation, configuration, request IDs, rate limits, one-time Shopify OAuth state, JWT expiry, and protected-route rejection of expired tokens. These tests use only fake in-memory input and do not connect to the database. The root project also uses Vitest: `npm run test` verifies the Next.js logout route's CSRF behavior and cookie deletion using mocked browser/Next.js dependencies.

## 17. Environment-variable reference

`09_ENVIRONMENT_VARIABLES.md` records every variable name read by the frontend and backend, its purpose, whether it is public or secret, and where development, preview, and production values belong. It deliberately contains names only, never real values.

## 18. Dependency audit

The installed root and backend packages were compared with source imports, configuration, and available versions. The frontend keeps the aggregate `radix-ui` package used by the UI components and no longer lists five redundant individual Radix packages. The unconfigured `tailwindcss-animate` plugin was also removed. Available framework major-version upgrades were deliberately deferred because they require separate compatibility work. Lint, TypeScript checks, backend tests, and both production builds passed after the cleanup.

## 19. Root repository guide

The root `README.md` now explains Aura's two-application layout, including the frontend directories, separate backend application, database material, deployment configuration, local run commands, and environment-file safety. It labels the broad product direction as planned rather than claiming unfinished integrations as completed features.

## 20. TypeScript configuration

Both the frontend and backend enable TypeScript strict mode. `10_TYPESCRIPT_CONFIGURATION.md` documents the effective strict checks, the explicitly relaxed unused-code and library-check settings, the currently unused frontend JavaScript allowance, and the commands that verify each application separately.

## 21. Repeatable schema changes

The migration directory contains the initial schema and a follow-up migration that aligns `metrics` and `insights` with current backend SQL. `database/migrations/README.md` documents a duplicate-data preflight and safe Supabase SQL Editor steps. The active Supabase database was manually verified to have a non-null `metrics.updated_at` column with a `now()` default, a uniqueness rule on `(brand_id, metric_type, date)`, and all current insight types accepted by the check constraint. The existing database names its metric constraint `unique_brand_metric_date`; fresh databases created by `002` use `unique_brand_metric_type_date`.

## 22. Database relationship diagram

`docs/database-schema.md` now contains a Mermaid ER diagram for the five tracked relationships between users, brands, integrations, metrics, and insights. It shows the exact foreign-key columns and marks the optional integration-to-metrics relationship.

## 23. Database deletion behavior

The schema guide documents each foreign-key deletion rule. Deleting a user or brand permanently cascades to related records. Deleting an integration preserves related metrics but clears their optional `integration_id`. Shopify disconnect is a status update, not a database deletion.

## 24. Supabase Row Level Security review

The active Supabase database has RLS enabled and dashboard-created ownership policies for all five Aura tables. Those policies use `auth.uid()`, but Aura currently uses custom backend JWTs and has no Supabase Auth users. Aura must therefore keep database access server-only and continue enforcing ownership in its backend. The full review is in `docs/11_SUPABASE_RLS_REVIEW.md`.

## 25. Database backup and restoration procedure

Aura documents a free-plan-friendly logical backup procedure using the Supabase CLI. It creates separate schema and data exports outside Git, verifies their file sizes and fingerprints, and requires a local disposable restore practice before any production restoration decision. The role export is optional because Aura has no tracked custom database roles and the managed CLI role may not have permission to create its temporary login role.

## 26. Structured production logging

The backend now writes structured JSON logs for completed HTTP requests, handled request errors, server lifecycle events, and its startup database connection. Request logs use only the path, never query parameters, so the Shopify redirect token is not written to logs. Background-job and service log migration was completed as a follow-up task.

## 27. Background-job and service logging

The daily sync job, Shopify sync service, and insights engine now use the structured logger. Their production events use safe aggregate counts and error details, while omitting Shopify domains, brand and integration IDs, access tokens, and revenue values. Route and controller log migration was completed as a follow-up task.

## 28. Route and controller logging

The remaining manual sync, manual insight-generation, and Shopify OAuth controller logs now use the structured logger. Shopify OAuth success logs no longer include a store name, store domain, or brand ID. Database-configuration and seed-script logs still use `console` and are tracked as a separate cleanup task.

## 29. Database and seed-script logging

Database configuration and the metrics seed script now use structured logs. Connection events record only safe retry and error details, while seed events no longer log fixed IDs or generated daily revenue, order, and customer values. The seed-script comments now correctly describe its 60-day loop and growth calculation.

## 30. Development-only seed configuration

The metrics seed script no longer contains fixed database IDs. It requires validated `SEED_BRAND_ID` and `SEED_INTEGRATION_ID` UUIDs from the ignored backend environment file, an explicit `ALLOW_METRICS_SEED=true` confirmation, and a non-production `NODE_ENV`. Unit tests cover accepted and rejected configurations without accessing the database.

## 31. Request ID tracing

Every backend HTTP request now receives a server-generated UUID. Aura returns it as the `X-Request-ID` response header and includes it in completion logs, error logs, 404 responses, and handled error responses. The ID contains no customer or authentication data; it lets a user report a harmless value that identifies the related safe log entries.

## 32. API versioning documentation

Aura documents its current single-version API behavior. `API_VERSION` defaults to `v1` and prefixes all API routes, while the frontend's `NEXT_PUBLIC_API_URL` must use the matching prefix. The guide distinguishes the route-contract version from the application version and explains that simultaneous `v1` and `v2` support requires future code, not an environment-variable change.

## 33. Endpoint-level request validation

All Aura-controlled endpoints that accept browser input now use reusable Zod schemas before controller logic runs. The schemas reject malformed UUIDs, invalid metric names, unsafe chart-day values, invalid Shopify domains, and invalid brand fields. Shopify's signed OAuth callback remains excluded because its dedicated CSRF and HMAC checks must receive the original provider query.

## 34. Authentication rate limiting

Aura limits one IP address to ten combined registration and login attempts per 15-minute window. Blocked requests receive HTTP 429, standard `RateLimit` headers, and a safe request ID. The current in-memory counter is suitable for the current single-instance deployment; a future multi-instance deployment needs a shared rate-limit store.

## 35. API response and error formats

Aura now documents the actual response contract for every mounted endpoint, including JSON success envelopes, information-route exceptions, central errors, 404 responses, authentication rate-limit responses, request IDs, and Shopify OAuth redirects. Examples use placeholders for UUIDs and JWTs; no credentials are included.
