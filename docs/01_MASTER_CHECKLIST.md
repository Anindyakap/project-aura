# Project Aura — Master Checklist

**Project:** D2C Growth Co-pilot  
**Document basis:** Manual project checklist dated March 16, 2026  
**Estimated progress in supplied documentation:** approximately 65%

> Rule: Codex must work on only one unchecked item at a time. A task may be checked only after implementation, verification, and documentation are complete.

## Phase 0 — Cloud Environment

- [x] Create the GitHub repository for Project Aura.
- [x] Connect the frontend repository to Vercel.
- [x] Connect the backend deployment to Render.
- [x] Create the Supabase PostgreSQL database.
- [ ] Verify that no secrets are committed to Git history.
  - [x] Remove the JWT-secret code fallback and require `JWT_SECRET` at backend startup.
  - [x] Rotate the deployed JWT secret and verify a new production login.
  - [x] Create and verify a private Git bundle backup before history cleanup.
  - [ ] Remove exposed credentials from reachable Git history.
- [x] Create or update `.env.example` files for frontend and backend.
- [x] Document the production, preview, and development environment-variable names.

## Phase 1 — Project Foundation

- [x] Initialize Next.js with TypeScript.
- [x] Configure Tailwind CSS v4 and Aura brand styling.
- [x] Install and configure Shadcn/UI components.
- [x] Establish the frontend structure using `app/`, `components/`, `lib/`, and `contexts/`.
- [x] Configure deployment environment variables.
- [x] Complete the first successful Vercel deployment.
- [x] Audit the installed package versions and remove unused dependencies.
- [x] Add root-level documentation explaining the monorepo or frontend/backend layout.
- [x] Confirm TypeScript strict mode and document any intentionally relaxed compiler options.

## Phase 2 — Database Design

- [x] Create the `users` table.
- [x] Create the `brands` table.
- [x] Create the `integrations` table.
- [x] Create the `metrics` table.
- [x] Create the `insights` table.
- [x] Add automatic `updated_at` triggers.
- [x] Add a unique constraint for `(brand_id, metric_type, date)`.
- [x] Update the insight-type constraint for all supported insight types.
- [x] Put all schema changes into repeatable migration files.
- [x] Add a database relationship diagram.
- [x] Document deletion behavior and foreign-key cascade rules.
- [x] Review Row Level Security requirements in Supabase.
- [x] Add a database backup and restoration procedure.

## Phase 3 — Backend API

- [x] Create the Express and TypeScript server.
- [x] Configure CORS for the frontend domain.
- [x] Add JSON parsing, request logging, and security headers.
- [x] Add global error handling with an `AppError` class.
- [x] Add `GET /health`.
- [x] Deploy the backend to Render.
- [x] Add structured production logging.
- [x] Gradually migrate remaining job and service `console` logs to the structured logger.
- [x] Migrate remaining route and controller `console` logs to the structured logger.
- [x] Migrate database-configuration and seed-script `console` logs to the structured logger.
- [x] Move hard-coded seed IDs into validated development-only configuration.
- [x] Align seed-script comments with its 60-day implementation.
- [x] Add request IDs for tracing errors across logs.
- [x] Add API versioning documentation.
- [x] Add endpoint-level request validation.
- [x] Add API rate limiting where appropriate.
- [x] Document all response and error formats.

## Phase 4 — Authentication

- [x] Implement registration with bcrypt password hashing.
- [x] Implement login with password verification and JWT creation.
- [x] Implement `GET /auth/me`.
- [x] Implement protected-route middleware.
- [x] Implement flexible authentication for OAuth redirects.
- [x] Build login and registration pages.
- [x] Build `AuthContext` for global authentication state.
- [x] Persist the token across refreshes.
- [x] Redirect unauthenticated users to login.
- [x] Remove any test credentials from public documentation.
- [x] Decide token storage: retain localStorage temporarily and plan an HTTP-only-cookie migration after Aura has a same-site frontend/API architecture.
- [x] Complete the HTTP-only-cookie migration: local and deployed verification pass.
  - [x] Add a same-origin Next.js API proxy, HTTP-only session cookie, and CSRF checks.
  - [x] Remove browser JWT storage and Shopify JWT query parameters.
  - [x] Add repeatable server-side Shopify OAuth state storage and backend tests.
  - [x] Apply and verify migration `003_add_shopify_oauth_states.sql` in Supabase.
  - [x] Configure `BACKEND_API_URL` in Vercel.
  - [x] Verify deployed login, refresh, logout, protected requests, and Shopify OAuth.
- [x] Add token expiry and logout behavior tests.
- [ ] Add password-policy validation.
- [ ] Add forgot-password and reset-password flows.
- [ ] Add account lockout or abuse protection.

## Phase 5 — Dashboard Layout

- [x] Build the persistent dashboard shell.
- [x] Add navigation for Overview, Integrations, Metrics, and Insights.
- [x] Add desktop sidebar collapse behavior.
- [x] Add the mobile hamburger menu and overlay.
- [x] Add a sticky header and user menu.
- [x] Add initials-based avatars.
- [x] Add logout in the user menu.
- [ ] Add keyboard-accessible navigation checks.
- [ ] Add focus states and accessibility labels.
- [ ] Verify layout behavior at common mobile, tablet, and desktop widths.

## Phase 6–7 — Shopify Integration

- [x] Create a Shopify Partner account and test store.
- [x] Implement the OAuth 2.0 flow.
- [x] Add CSRF state validation.
- [x] Add HMAC callback verification.
- [x] Exchange the temporary code for an access token.
- [x] Fetch and store shop details.
- [x] Add UPSERT behavior for reconnecting a store.
- [x] Build the Shopify connection form.
- [x] Add shop-domain validation.
- [x] Add disconnect functionality.
- [x] Show connection status.
- [x] Add Meta Ads and Google Ads placeholders.
- [ ] Confirm the current Shopify API version and update deprecated REST usage if necessary.
- [ ] Encrypt stored access tokens at rest.
- [ ] Add retry and rate-limit handling.
- [ ] Add integration-health and expired-token handling.
- [ ] Replace seed-only behavior after Shopify protected-data approval.
- [ ] Add automated OAuth callback tests.

## Phase 8–9 — Meta Ads Integration

- [ ] Define the exact Meta Ads data required for the first release.
- [ ] Create and configure the Meta developer application.
- [ ] Implement Meta OAuth authorization.
- [ ] Store access tokens securely.
- [ ] Add ad-account selection.
- [ ] Import campaigns, ad sets, and ads.
- [ ] Import spend, impressions, clicks, conversions, and revenue attribution fields.
- [ ] Calculate CTR, CPC, CPM, CPA, conversion rate, and ROAS.
- [ ] Handle long-lived token renewal and expiration.
- [ ] Add pagination, retries, and rate-limit handling.
- [ ] Build the Meta integration UI.
- [ ] Add connection, reconnect, and disconnect states.
- [ ] Add unit and integration tests.
- [ ] Document the data mapping from Meta to Aura.

## Phase 10–11 — Google Ads Integration

- [ ] Define the exact Google Ads data required for the first release.
- [ ] Configure the Google Cloud project and OAuth consent screen.
- [ ] Implement Google OAuth authorization.
- [ ] Add Google Ads customer-account selection.
- [ ] Securely store refresh and access tokens.
- [ ] Import campaigns and daily performance data.
- [ ] Calculate CTR, CPC, CPA, conversion rate, and ROAS.
- [ ] Handle refresh tokens and revoked access.
- [ ] Add pagination, retries, and quota handling.
- [ ] Build the Google Ads integration UI.
- [ ] Add connection, reconnect, and disconnect states.
- [ ] Add tests and mapping documentation.

## Phase 12 — Data Ingestion

- [x] Implement Shopify order fetching.
- [x] Implement pagination support.
- [x] Calculate revenue, order count, and new customers.
- [x] UPSERT daily metric values.
- [x] Run a daily cron job at midnight UTC.
- [x] Add a manual Shopify sync endpoint.
- [x] Create 60 days of realistic seed metrics.
- [ ] Add synchronization status records and failure reasons.
- [ ] Make sync jobs idempotent and document how duplicate execution is prevented.
- [ ] Add backfill for a selected historical date range.
- [ ] Add per-integration timezone handling.
- [ ] Add monitoring for failed or stale synchronization.
- [ ] Add tests for pagination and metric calculations.

## Phase 13 — Metrics Engine

- [x] Add the metrics summary endpoint.
- [x] Add the metrics chart endpoint.
- [x] Calculate AOV on the server.
- [x] Calculate percent change against the previous period.
- [x] Check brand ownership on metric endpoints.
- [ ] Define behavior when the previous-period value is zero.
- [ ] Add configurable time periods.
- [ ] Add currency handling per brand.
- [ ] Add timezone-safe date boundaries.
- [ ] Add unit tests for every formula and edge case.

## Phase 14–15 — Dashboard Overview

- [x] Add KPI cards for Revenue, Orders, AOV, and New Customers.
- [x] Add percentage-change indicators.
- [x] Add skeleton loading states.
- [x] Add the 30-day area chart.
- [x] Add a Revenue/Orders chart toggle.
- [x] Add quick-stat summaries.
- [x] Fetch dashboard data in parallel using `Promise.all`.
- [x] Add a custom chart tooltip.
- [ ] Add user-controlled date ranges.
- [ ] Add error states with retry actions.
- [ ] Add accessible chart summaries for screen readers.
- [ ] Add CSV export for visible metrics.

## Polish — Dark Mode and Responsive Design

- [x] Add `ThemeContext`.
- [x] Persist theme preference in localStorage.
- [x] Detect the operating-system theme on first visit.
- [x] Apply dark styling to cards, text, and borders.
- [x] Calculate chart colors dynamically.
- [x] Resolve the Recharts CSP issue.
- [x] Fix unwanted light borders and chart baseline artifacts.
- [x] Add mobile responsive layout behavior.
- [ ] Add a theme flash-prevention strategy.
- [ ] Add visual regression checks for light and dark modes.

## Phase 16 — Insights Engine

- [x] Build the rules-based insights engine.
- [x] Add Revenue Drop detection.
- [x] Add Revenue Spike detection.
- [x] Add Order Volume Drop detection.
- [x] Add AOV Improvement detection.
- [x] Add New Customer Drop detection.
- [x] Add the All Metrics Up insight.
- [x] Remove insights older than seven days.
- [x] Prevent duplicate same-day insight rows.
- [x] Add endpoints to list, read, mark all read, and generate insights.
- [x] Run the insight engine after daily sync.
- [x] Connect the frontend to real insight data.
- [x] Add optimistic mark-as-read behavior.
- [x] Add refresh, loading, and empty states.
- [ ] Move thresholds into configurable settings.
- [ ] Add evidence fields showing the metric values behind each insight.
- [ ] Add deep links from insights to relevant campaign or metric pages.
- [ ] Add deterministic unit tests for each rule.
- [ ] Add an explanation of why a rule did or did not fire.
- [ ] Enforce brand ownership when marking one or all insights as read.

## Phase 17 — Unread Badge

- [x] Keep unread count in the dashboard layout.
- [x] Fetch unread count on navigation.
- [x] Show the count in the expanded sidebar.
- [x] Show a red dot in the collapsed sidebar.
- [x] Remove the badge after all insights are marked read.
- [ ] Avoid unnecessary refetches by centralizing insight state or using a data-fetching cache.
- [ ] Add tests for badge synchronization.

## Phase 18 — Campaign Deep-Dive Pages

- [ ] Define campaign detail page information architecture.
- [ ] Add campaign list and filters.
- [ ] Add a campaign detail route.
- [ ] Add trend charts for spend, revenue, CPA, and ROAS.
- [ ] Compare current and previous periods.
- [ ] Show channel, campaign, ad-set, and ad hierarchy where available.
- [ ] Link relevant insights to campaign details.
- [ ] Add loading, empty, and error states.
- [ ] Add responsive and accessibility checks.
- [ ] Add tests.

## Phase 19 — Webhook System

- [ ] Define supported webhook events.
- [ ] Create webhook endpoint registration.
- [ ] Store webhook URLs securely.
- [ ] Sign outgoing payloads.
- [ ] Add retry with exponential backoff.
- [ ] Add delivery logs and failure status.
- [ ] Add Zapier and Make examples.
- [ ] Add a test-delivery action.
- [ ] Add enable, disable, edit, and delete controls.
- [ ] Add tests and documentation.

## Phase 20 — Settings

- [ ] Add a settings page.
- [ ] Add brand name, domain, currency, and timezone settings.
- [ ] Add insight-threshold settings.
- [ ] Add notification preferences.
- [ ] Add integration management links.
- [ ] Add account settings and logout-all-sessions behavior.
- [ ] Validate and persist all settings.
- [ ] Add tests.

## Phase 21 — Automated Tests

- [ ] Choose and document the frontend test framework.
- [x] Choose and document the backend test framework.
- [ ] Add metrics formula unit tests.
- [ ] Add insight-rule unit tests.
- [ ] Add authentication middleware tests.
- [ ] Add brand ownership tests.
- [ ] Add API route integration tests.
- [ ] Add frontend component tests.
- [ ] Add one complete end-to-end happy-path test.
- [ ] Add test coverage reporting.
- [ ] Make tests required in CI.

## Phase 22 — Security and Performance Audit

- [ ] Run dependency vulnerability checks.
- [ ] Audit authentication token storage.
- [ ] Audit OAuth state and callback handling.
- [ ] Audit CORS and CSP configuration.
- [ ] Audit database access and authorization.
- [ ] Add rate limiting and abuse prevention.
- [ ] Add input validation and output encoding checks.
- [ ] Audit logging to ensure secrets are never printed.
- [ ] Profile slow API endpoints.
- [ ] Add database indexes based on actual query plans.

## Phase 23 — Documentation

- [ ] Keep `02_PROJECT_SUMMARY.md` current.
- [ ] Keep `03_CODEBASE_GUIDE.md` current.
- [ ] Document every environment variable.
- [ ] Document all API endpoints.
- [ ] Document the database schema.
- [ ] Document deployment and rollback.
- [ ] Document local or cloud development setup.
- [ ] Add architecture diagrams.
- [ ] Add a troubleshooting guide.
- [ ] Add known limitations and future work.

## Phase 24 — Monitoring and CI/CD

- [ ] Add Sentry or an equivalent error-monitoring service.
- [ ] Add backend health and uptime monitoring.
- [ ] Add a GitHub Actions workflow for linting, type-checking, and tests.
- [ ] Add preview-deployment checks.
- [ ] Add database migration checks.
- [ ] Add deployment rollback instructions.
- [ ] Add production smoke tests.
- [ ] Add alerts for failed sync jobs.

## Phase 25 — Portfolio Preparation

- [x] Prepare a case-study document.
- [x] Prepare resume bullets.
- [x] Prepare a LinkedIn post.
- [x] Prepare a GitHub README draft.
- [x] Prepare interview answers for key technical decisions.
- [x] Prepare questions for interviewers.
- [x] Prepare key project statistics.
- [ ] Verify all portfolio claims against the current production system.
- [ ] Record a current demo video.
- [ ] Remove or mask all test credentials and sensitive data.
- [ ] Add updated screenshots in light and dark modes.
- [ ] Add a public architecture diagram.

## Final Release Gate

- [ ] Lint passes.
- [ ] Type-check passes.
- [ ] Unit tests pass.
- [ ] Integration tests pass.
- [ ] Production smoke tests pass.
- [ ] No secrets are present in Git history.
- [ ] Documentation matches the real code.
- [ ] Database migrations can rebuild the schema from scratch.
- [ ] Monitoring and alerts are active.
- [ ] The portfolio description accurately reflects completed functionality.
