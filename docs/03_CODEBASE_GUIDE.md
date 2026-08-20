# Project Aura — Every File Explained
*What each file does, why it exists, and the logic behind it*
*Updated: March 1, 2026*

---

# THE BIG PICTURE FIRST

## Git and environment-file safety

Environment variables provide deployment-specific configuration without placing private values in source code. Git ignore rules prevent new matching files from being added, but they do not remove files or values already committed. Aura's reachable Git history contains an expired JWT-shaped test token and an earlier JWT-secret fallback. The current API test file no longer contains the token, the backend now refuses to start without a non-blank `JWT_SECRET`, and the deployed JWT secret was rotated and verified through a new production login. A private Git bundle backup was verified before cleanup. Coordinated Git-history remediation remains unchecked work. Keep values for `JWT_SECRET`, database URLs, OAuth secrets, and temporary JWT tokens in deployment settings or uncommitted local files rather than Git.

The root `.env.example` file documents the server-only `BACKEND_API_URL` used by Next.js route handlers. `backend/.env.example` documents the backend values it reads, including `DATABASE_URL`, `JWT_SECRET`, and Shopify OAuth configuration. Copy a template to the matching local environment file, then replace only its placeholder values. Never copy a real secret into either example file.

Aura bundles its Inter variable font in `app/fonts/` and loads it through `next/font/local` in `app/layout.tsx`. This avoids a Google Fonts download during production builds. `LICENSE-Inter.txt` is stored beside the font asset.

The backend uses Vitest 3.2.7 for automated tests. Run `npm test` from `backend/` to execute validation, password-policy, configuration, request-ID, rate-limit, Shopify OAuth state, and JWT-expiry tests. Run `npm run test` from the repository root to test the Next.js logout route and session-cookie clearing. These tests use fake inputs and mocked Next.js dependencies, so they do not start the API server or access the database.

For the complete names-only environment-variable reference, read `docs/09_ENVIRONMENT_VARIABLES.md`. It distinguishes browser-visible `NEXT_PUBLIC_` values from backend secrets and shows which deployment platform supplies each setting.

The frontend UI imports Radix primitives from the aggregate `radix-ui` package. Individual Radix package entries and an unconfigured animation plugin were removed from the root dependency list after lint, type checks, tests, and production builds confirmed that the application still works.

The root `README.md` is the short orientation guide: it explains the frontend/backend boundary, the main folders, local commands, and environment-file safety. Use it before this detailed file-by-file guide.

Both TypeScript applications use strict mode. Read `docs/10_TYPESCRIPT_CONFIGURATION.md` for the compiler settings, why unused-code checks are delegated to ESLint warnings, and the separate frontend and backend type-check commands.

Database schema changes live in `database/migrations/` and run in numeric order. `002_align_schema_with_backend.sql` adds the metric timestamp and uniqueness support required by backend upserts, then aligns accepted insight types with the rules engine. The active Supabase schema was manually verified after this migration work. Read `database/migrations/README.md` before applying migrations to another database.

The database relationship diagram in `docs/database-schema.md` shows each primary key, foreign key, and optional relationship. It is generated from the foreign-key definitions in `001_initial_schema.sql`.
The same schema guide explains cascade and `SET NULL` deletion behavior. Read it before adding a user, brand, or integration deletion endpoint.
Read `docs/11_SUPABASE_RLS_REVIEW.md` before changing authentication, Supabase access, or database roles. Aura's current custom-JWT backend does not use Supabase Auth, so its dashboard-created `auth.uid()` policies are not the active authorization mechanism.
Read `docs/12_DATABASE_BACKUP_AND_RESTORE.md` before schema work or any attempt to restore Aura's database. Backup files are confidential and must stay outside the repository.
Read `docs/13_API_VERSIONING.md` before changing `API_VERSION`, API route paths, or the frontend backend URL. Aura currently serves one route-contract version at a time: the backend's `API_VERSION` and Vercel's server-only `BACKEND_API_URL` must both use the same prefix, currently `/api/v1`.
`backend/src/middleware/validate.ts` runs Zod schemas at API boundaries before controllers access request bodies, query strings, or route parameters. The schemas in `backend/src/utils/validation.ts` validate external shapes such as UUIDs, metric names, chart days, brand fields, and Shopify connection input. Validation rejects malformed input with a 400 response; it does not replace authentication or ownership checks.
`backend/src/middleware/rateLimit.ts` protects the public registration and login routes from repeated attempts. It permits ten combined attempts per IP address in 15 minutes, then returns HTTP 429. `server.ts` trusts one proxy hop so Render-proxied requests are limited by visitor IP rather than all sharing the proxy IP. The initial limiter stores counters only in the current backend process, so a multi-instance deployment will require a shared store.
Read `docs/14_API_RESPONSE_AND_ERROR_FORMATS.md` before changing a controller response, error handler, rate-limit handler, or OAuth redirect. It records the current API contract and its intentional exceptions, including the distinct 404 JSON shape and redirect-based Shopify OAuth behavior.
The backend's core request, error, startup, and startup database-connection logs are JSON entries from `backend/src/utils/logger.ts`. Request paths intentionally exclude query parameters so tokens are not recorded. `backend/src/middleware/requestId.ts` runs before the request logger, creates one server-generated UUID per HTTP request, returns it in `X-Request-ID`, and adds it to request and error logs. A user can share this harmless ID to identify related log entries. Background-job and service logs were migrated separately.
The daily sync job, Shopify sync service, and insights engine now also use the structured logger. They log safe aggregate event details rather than store domains, database identifiers, tokens, or revenue values.
Manual sync, manual insight generation, Shopify OAuth controller events, database configuration, and the metrics seed script all use the structured logger. The central logger utility is now the only backend location that writes directly to `console`.
The metrics seed script now reads validated development-only IDs from `backend/.env`. It refuses production mode and requires `ALLOW_METRICS_SEED=true` before it can delete and replace a development brand's metrics.

Before anything else, understand the three-layer architecture:

```
┌─────────────────────────────────────────────┐
│              LAYER 1: FRONTEND               │
│         Next.js on Vercel                    │
│   "What the user sees and clicks on"         │
│   project-aura-gamma.vercel.app              │
└─────────────────┬───────────────────────────┘
                  │ sends HTTP requests
                  │ "give me the brands list"
                  ▼
┌─────────────────────────────────────────────┐
│              LAYER 2: BACKEND                │
│         Node.js + Express on Render          │
│   "The brain — processes requests,           │
│    runs business logic, talks to DB"         │
│   aura-backend-ks8e.onrender.com             │
└─────────────────┬───────────────────────────┘
                  │ SQL queries
                  │ "SELECT * FROM brands"
                  ▼
┌─────────────────────────────────────────────┐
│              LAYER 3: DATABASE               │
│         PostgreSQL on Supabase               │
│   "Permanent storage —                       │
│    everything saved here survives            │
│    server restarts, deployments"             │
└─────────────────────────────────────────────┘
```

Every single user action follows this exact path:
```
User does something on screen
        ↓
Frontend updates state / sends request to Backend
        ↓
Backend validates, runs logic, queries Database
        ↓
Database returns data
        ↓
Backend sends response
        ↓
Frontend updates what user sees
```

---

# BACKEND FILES

---

## `backend/src/server.ts` — The Main Entry Point

### What it is
The first file that runs when Render starts your backend.
Like the front desk of a hotel — doesn't do the actual work,
but knows who handles what and directs everything correctly.

### Why it exists
Something has to start the server, load all the settings,
register all the routes, and begin listening for requests.
Without this file, your backend simply doesn't exist.

### The logic flow
```
Render boots up
      │
      ▼
Load .env file
"Read all secret keys and settings from environment"
DATABASE_URL, JWT_SECRET, PORT, etc.
      │
      ▼
Create the Express app
"I am now a web server, ready to receive HTTP requests"
      │
      ▼
Register MIDDLEWARE (runs on EVERY request, in order)
      │
      ├─ CORS
      │    WHY: Browsers block requests from different domains by default
      │    FIX: "I allow requests from project-aura-gamma.vercel.app"
      │    Without this, frontend can't talk to backend
      │
      ├─ JSON Parser
      │    WHY: HTTP requests arrive as raw text
      │    FIX: Convert {"email":"x"} text → usable JavaScript object
      │    Without this, req.body would be undefined
      │
      ├─ Request Logger
      │    WHY: See every request in logs for debugging
      │    Shows: "POST /api/v1/auth/login | 200 | 38ms"
      │
      └─ Security Headers
           WHY: Add protective HTTP headers to every response
           Prevents common web attacks (XSS, clickjacking)
      │
      ▼
Register ROUTES
"Tell Express which URL paths go to which handlers"
      │
      ├─ /api/v1/auth       → auth.routes.ts
      ├─ /api/v1/brands     → brands.routes.ts
      ├─ /api/v1/integrations/shopify → shopify.routes.ts
      ├─ /api/v1/metrics    → metrics.routes.ts
      └─ /api/v1/sync       → sync.routes.ts
      │
      ▼
Start listening on PORT 4000
"Ready! Send me requests."
      │
      ▼
Connect to database
      │
      ├─ SUCCESS → "✅ Database connected"
      └─ FAIL    → "❌ DB connection failed (5/5)"
                   Retry 5 times before giving up
      │
      ▼
Register cron jobs
Structured log: "Daily Shopify sync scheduled"
```

---

## `backend/src/middleware/auth.ts` — The Bouncer

### What it is
A function that runs BEFORE any protected route handler.
Checks: "Does this request have a valid login token?"

### Why it exists
Without this, anyone on the internet could call
`GET /api/v1/brands` and get all users' data.
This ensures only logged-in users access protected routes.

### The logic flow
```
Request arrives at a protected route
e.g. GET /api/v1/brands
      │
      ▼
auth.ts runs BEFORE the route handler:

Does the request have an Authorization header?
Header format: "Authorization: Bearer eyJhbGc..."
      │
      ├─ NO → Reject immediately
      │        Return 401 "No token provided"
      │        Route handler NEVER runs
      │
      └─ YES → Extract the token
                Strip "Bearer " prefix
                Keep only: "eyJhbGc..."
                      │
                      ▼
                Is the token genuine and not expired?
                Verify using our JWT_SECRET key
                      │
                      ├─ INVALID/EXPIRED → Reject
                      │                    Return 401 "Invalid token"
                      │
                      └─ VALID → Decode the payload
                                  Extract: { userId, email }
                                  Attach to request:
                                  req.user = { userId, email }
                                        │
                                        ▼
                                  Continue to route handler ✓
                                  Handler can now use req.user.userId
```

### Why JWT tokens (not sessions)?
```
Sessions (old approach):
  Login → Server creates session → Stores in memory
  Problem: Server restarts = all sessions lost
           Multiple servers = sessions don't sync

JWT (what we use):
  Login → Server creates signed token → Browser stores it
  Token contains: { userId, email, expiry }
  Server signs it with secret key

  Next request: Browser sends token
  Server verifies signature — no memory needed!
  Works across restarts, multiple servers, Render's free tier

Structure of a JWT:
  eyJhbGciOiJIUzI1NiJ9 . eyJ1c2VySWQiOiJhYmMifQ . xK8dF2mN9pL
  ─────────────────────   ────────────────────────   ────────────
       Header                    Payload               Signature
  "algorithm: HS256"        "userId, email,         "proves genuine,
                             expiry: tomorrow"       signed with secret"
```

### Historical flexibleAuth (removed)
```
Normal protect: reads token from Authorization HEADER
Problem: Browser redirects can't send custom headers!
         window.location.href = "..." is a full page redirect

flexibleAuth solution:
  Try header first → if not found → try URL query param
  ?token=eyJhbGc...

  Used for /integrations/shopify/connect
  because that endpoint triggers a browser redirect to Shopify
```

---

## `backend/src/controllers/auth.controller.ts` — Login & Register

### What it is
Handles creating accounts and logging in.

### Register flow
```
POST /api/v1/auth/register
Body: { email, password, name }
      │
      ▼
Does this email already exist in users table?
      │
      ├─ YES → Return 409 "Email already exists"
      │
      └─ NO  → Hash the password
                WHY: NEVER store plain text passwords
                "password123" → "$2b$10$xyz..." (irreversible)
                If database is hacked, passwords are safe
                      │
                      ▼
                INSERT INTO users (email, password_hash, name)
                      │
                      ▼
                Generate JWT token
                Sign { userId, email } with JWT_SECRET
                      │
                      ▼
                Return { user, token }
                Frontend saves token to localStorage
```

### Login flow
```
POST /api/v1/auth/login
Body: { email, password }
      │
      ▼
Find user by email in database
      │
      ├─ NOT FOUND → Return 401 "Invalid email or password"
      │              (vague on purpose — don't reveal which part is wrong)
      │
      └─ FOUND → Compare passwords
                  bcrypt.compare("password123", "$2b$10$xyz...")
                  WHY: Can't reverse a hash
                       So hash the input and compare results
                        │
                        ├─ WRONG → Return 401
                        │
                        └─ CORRECT → Generate JWT token
                                      Return { user, token }
```

---

## `backend/src/controllers/brands.controller.ts` — Brand Management

### What it is
Creates and fetches brands.
A brand = one store + all its connected platforms + metrics.

### Why brands exist at all
```
Without brands:
  User connects Shopify → stored as "this user's Shopify"
  User wants to manage another store → overwrites the first!
  Can't separate data between stores

With brands:
  User creates "Jewelry Store" brand
  User creates "Clothing Store" brand
  Each brand has own integrations, metrics, insights
  Data is cleanly separated ✓
```

### getBrands flow
```
GET /api/v1/brands
      │
      ▼
protect middleware runs first
Extracts userId from JWT: req.user.userId = "abc-123"
      │
      ▼
SELECT * FROM brands
WHERE user_id = "abc-123"
WHY the filter: Users only see THEIR brands
                Never return other users' data
      │
      ▼
Return array of brands
```

### createBrand flow
```
POST /api/v1/brands
Body: { name: "My Jewelry Store", domain: "jewelry.com" }
      │
      ▼
protect middleware: get userId from token
      │
      ▼
INSERT INTO brands (user_id, name, domain)
RETURNING * (give back the created row)
      │
      ▼
Return newly created brand with its UUID
```

---

## `backend/src/controllers/shopify.controller.ts` — OAuth 2.0

### What it is
Connects Shopify stores to Aura without ever seeing the user's Shopify password.

### Why OAuth instead of asking for their password?
```
Asking for password (dangerous):
  User gives us Shopify password
  We log in on their behalf
  Problems:
    We now have their password — liability
    If we get hacked, their store is exposed
    No way to revoke without changing password

OAuth 2.0 (safe, industry standard):
  We never see their password
  Shopify gives us a limited "access key" (token)
  Token can be revoked anytime
  Token only has permissions we asked for
  Used by Google, Facebook, GitHub, Stripe, everyone
```

### connectShopify() — Start the OAuth dance
```
User clicks "Connect Shopify"
Enters: "aura-testing.myshopify.com"
      │
      ▼
Frontend calls:
GET /api/v1/integrations/shopify/connect
    ?shop=aura-testing.myshopify.com
    &brandId=1c8b2004-...
    &token=eyJhbGc...     ← JWT in URL because browser redirect
      │
      ▼
flexibleAuth: verify JWT, attach req.user
      │
      ▼
STEP 1: Validate inputs
  Does shop end in .myshopify.com? ✓
  Does brandId belong to this user? Query DB ✓
      │
      ▼
STEP 2: Generate CSRF protection state
  nonce = random 16-char hex (e.g. "a3f8b2c1d4e5f6a7")
  state = nonce + ":" + brandId
  Example: "a3f8b2c1d4e5f6a7:1c8b2004-e667-..."

  WHY: CSRF = Cross-Site Request Forgery
  A hacker could trick your browser into making requests
  The random nonce makes this impossible to guess
  Packing brandId inside means we get it back after redirect
      │
      ▼
STEP 3: Save state in cookie (expires in 10 min)
  WHY: We need to remember what we sent
  State travels: Us → Shopify → Back to us
  Cookie is how we "remember" across redirects
      │
      ▼
STEP 4: Redirect browser to Shopify's approval screen
  URL: https://aura-testing.myshopify.com/admin/oauth/authorize
       ?client_id=e3288e774a3cb1ac92dc2d2ec1ad7e65
       &scope=read_orders,read_products,read_analytics
       &redirect_uri=https://aura-backend.../callback
       &state=a3f8b2c1...:1c8b2004-...

  User sees: "Aura wants to access your store. Allow?"
  User clicks: "Install app" ✓
```

### shopifyCallback() — Shopify calls us back
```
Shopify redirects browser to our callback URL:
GET /api/v1/integrations/shopify/callback
    ?shop=aura-testing.myshopify.com
    &code=TEMPORARY_ONE_TIME_CODE
    &state=a3f8b2c1...:1c8b2004-...   ← same state we sent
    &hmac=SHOPIFY_SIGNATURE
      │
      ▼
SECURITY CHECK 1: State matches cookie?
  URL state === cookie state?
      │
      ├─ NO MATCH → Reject! Possible CSRF attack
      │
      └─ MATCH ✓ → Extract brandId from state
                    state.split(":")[1] = "1c8b2004-..."
      │
      ▼
SECURITY CHECK 2: HMAC verification
  Shopify signs all callbacks with our client secret
  We recalculate the signature and compare

  WHY: Proves this request genuinely came from Shopify
  A hacker can't fake this without knowing our secret

  Verified ✓
      │
      ▼
STEP 3: Exchange temporary code for permanent token
  The code in the URL is ONE-TIME USE, expires in minutes
  We POST to Shopify: "Here's the code + our credentials"
  Shopify responds: "Here's your permanent access token"

  WHY temporary code first?
  The code is visible in browser URL bar and logs
  The actual token exchange happens server-to-server
  Much more secure — token never touches browser
      │
      ▼
STEP 4: Use token to fetch store details
  GET /admin/api/2026-01/shop.json
  Headers: { X-Shopify-Access-Token: access_token }
  Returns: store name, email, currency, timezone
      │
      ▼
STEP 5: Save everything to database
  INSERT INTO integrations:
    brand_id = "1c8b2004-..."      (extracted from state)
    platform = "shopify"
    status = "connected"
    access_token = permanent token (for future API calls)
    platform_account_id = "aura-testing.myshopify.com"
    platform_account_name = "aura-testing"
    metadata = { email, currency, timezone }

  UPSERT = INSERT or UPDATE if already exists
  WHY: User might reconnect same store — no duplicates
      │
      ▼
STEP 6: Redirect to frontend with success
  → https://project-aura-gamma.vercel.app
      /dashboard/integrations?shopify=connected
```

---

## `backend/src/services/shopify.sync.ts` — Data Fetcher

### What it is
The engine that pulls order data from Shopify and saves it as metrics.
Called by the cron job every day at midnight.

### Why it exists
Having a connected Shopify store is useless without actually fetching the data.
This file does the actual work of reading orders and storing metrics.

### The logic flow
```
syncAllShopifyIntegrations() is called (by cron or manually)
      │
      ▼
Get all connected Shopify integrations from DB
SELECT id, brand_id, access_token, platform_account_id
FROM integrations
WHERE platform = 'shopify' AND status = 'connected'
      │
      ├─ NONE FOUND → Log "no integrations, skipping" → done
      │
      └─ FOUND → Loop through each integration one by one
                  WHY one by one, not all at once?
                  Shopify rate limits: 40 requests/second per store
                  Parallel requests would hit the limit
                        │
                        ▼
                  syncSingleIntegration(integration)
                        │
                        ▼
                  Calculate today's date range
                  startOfDay = "2026-02-25T00:00:00Z"
                  endOfDay   = "2026-02-25T23:59:59Z"
                        │
                        ▼
                  fetchShopifyOrders(shop, token, start, end)
                        │
                        ▼
                  Call Shopify REST API:
                  GET /admin/api/2026-01/orders.json
                      ?financial_status=paid   ← only count real revenue
                      &created_at_min=...
                      &created_at_max=...
                      &limit=250               ← Shopify's max per page

                  PAGINATION LOOP:
                  Get 250 orders → check for "next page" link
                  If next page exists → fetch that too
                  Repeat until no more pages
                  WHY: Busy stores may have 1000+ orders/day
                        │
                        ▼
                  calculateMetrics(orders, date)
                  revenue = sum of all order.total_price
                  orders  = count of orders
                  newCustomers = orders where customer.orders_count === 1
                                 (first ever order from this customer)
                        │
                        ▼
                  saveMetrics(brandId, integrationId, metrics)
                  INSERT 3 rows per day:
                    (brand_id, date, "revenue",       1231.16)
                    (brand_id, date, "orders",        11)
                    (brand_id, date, "new_customers", 3)
                  ON CONFLICT → UPDATE (safe to run twice)
                        │
                        ▼
                  UPDATE integrations SET last_sync_at = NOW()
                  "Mark when we last successfully synced"
```

---

## `backend/src/jobs/sync.jobs.ts` — The Alarm Clock

### What it is
Registers scheduled tasks (cron jobs) that run automatically at set times.

### Why it exists
Data needs to be fetched every day without anyone manually triggering it.
This file sets up the alarm clock.

### The logic flow
```
Server starts
      │
      ▼
registerSyncJobs() is called from server.ts
      │
      ▼
Register daily Shopify sync job:
Schedule: "0 0 * * *"

CRON SYNTAX EXPLAINED:
  "0 0 * * *"
   │ │ │ │ └─ day of week (* = every day)
   │ │ │ └─── month (* = every month)
   │ │ └───── day of month (* = every day)
   │ └─────── hour (0 = midnight)
   └───────── minute (0 = on the hour)

Translation: "At minute 0 of hour 0, every day"
= Every day at midnight UTC
      │
      ▼
When midnight arrives:
  Structured log: "Scheduled sync started"
  Call syncAllShopifyIntegrations()
  If error → log it, but don't crash the server
             Next day it will try again
```

---

## `backend/src/controllers/metrics.controller.ts` — The Calculator

### What it is
Reads raw metrics from the database, calculates summaries, and serves them to the frontend.

### Why it exists
The database stores raw daily numbers like "revenue on Feb 25 = $1231".
The frontend needs calculated summaries like "total revenue = $34,010, up 18% from last month".
This file does that math.

### getMetricsSummary() flow
```
GET /api/v1/metrics/summary?brandId=1c8b2004-...
      │
      ▼
protect middleware: verify JWT, get userId
      │
      ▼
Verify brand belongs to this user (security check)
      │
      ▼
QUERY 1: Current period (last 30 days)
SELECT metric_type, SUM(value) as total
FROM metrics
WHERE brand_id = ? AND date >= today-29days
GROUP BY metric_type

Result: { revenue: 34010, orders: 401, new_customers: 141 }
      │
      ▼
QUERY 2: Previous period (30-60 days ago)
Same query but for the period before
Result: { revenue: 28721, orders: 274, new_customers: 88 }

WHY two queries?
To calculate % change for trend arrows:
"+18.52% vs last 30 days"
      │
      ▼
Calculate derived metrics:
  AOV (Average Order Value) = revenue / orders
  = 34010 / 401 = $84.81
      │
      ▼
Calculate % change for each metric:
  percentChange(28721, 34010) = +18.52%
  Formula: ((current - previous) / previous) * 100
      │
      ▼
Return formatted response:
{
  revenue: { value: 34010, change: 18.52, formatted: "$34,010.65" }
  orders:  { value: 401,   change: 8.46,  formatted: "401" }
  aov:     { value: 84.81, change: 9.27,  formatted: "$84.81" }
  ...
}
```

### getMetricsChart() flow
```
GET /api/v1/metrics/chart?brandId=...&metric=revenue&days=30
      │
      ▼
Validate metric type against allowed list
WHY: Prevents SQL injection
"revenue" ✓ / "orders" ✓ / "DROP TABLE metrics" ✗
      │
      ▼
SELECT date, value FROM metrics
WHERE brand_id = ? AND metric_type = 'revenue'
AND date >= today-29days
ORDER BY date ASC   ← oldest first so chart draws left→right
      │
      ▼
Return array of data points:
[
  { date: "2026-01-30", value: 892.15 },
  { date: "2026-01-31", value: 1043.28 },
  ...30 points total
]
Frontend feeds this directly to Recharts
```

---

## `backend/src/scripts/seed-metrics.ts` — The Data Generator

### What it is
A one-time script that generates 60 days of realistic fake data
and inserts it into the metrics table.

### Why it exists
Shopify's protected customer data policy blocked our real data sync.
Rather than wait weeks for approval, we generate realistic demo data
that lets us build and demonstrate all remaining features.

### The logic
```
Delete all existing metrics for this brand (fresh start)
      │
      ▼
Loop: daysBack = 59 down to 0
(59 days ago → today)
      │
      ▼
For each day, calculate realistic metrics:

GROWTH TREND:
growthMultiplier = 0.95 + (59 - daysBack) * (0.10/59)
Day 59 ago: multiplier = 0.95  (lower sales in past)
Today:      multiplier = 1.05  (higher sales now)
WHY: Real brands grow over time. Shows upward trend.

WEEKEND EFFECT:
isWeekend = Saturday or Sunday?
weekendMultiplier = 1.4 if weekend, 1.0 if weekday
WHY: D2C jewelry brands see 40% more orders on weekends
People shop more on days off

RANDOM VARIATION:
randomBetween(0.7, 1.3)  → ±30% random daily noise
WHY: Real data is never perfectly smooth
Randomness makes the chart look authentic

FINAL CALCULATION:
orders = 12 * growthMultiplier * weekendMultiplier * random
revenue = orders * (85 * growthMultiplier * random)
newCustomers = orders * 0.35 * random
      │
      ▼
INSERT 3 rows per day into metrics table
ON CONFLICT → UPDATE (safe to run multiple times)
      │
      ▼
Write safe structured start, clear, completion, or error events
✅ Done — 60 days × 3 metrics = 180 rows inserted
```

---

# FRONTEND FILES

---

## `contexts/ThemeContext.tsx` — Dark Mode Manager

### What it is
Manages the dark/light theme across the entire app.
Any component anywhere can read and change the theme.

### Why it exists
Without a central theme manager:
- Every component would need to manage its own dark mode state
- Toggling theme would only affect one component
- Theme wouldn't persist after page refresh

### The logic flow
```
App loads for the first time
      │
      ▼
ThemeContext initializes:
Check localStorage for saved preference
  "aura_theme" = "dark" or "light" or nothing
      │
      ├─ SAVED PREFERENCE EXISTS → use it
      │
      ├─ NO PREFERENCE → check OS setting
      │   window.matchMedia("(prefers-color-scheme: dark)")
      │   User has OS dark mode on? → start in dark mode
      │
      └─ NEITHER → default to "light"
      │
      ▼
applyTheme(theme):
  If "dark"  → document.documentElement.classList.add("dark")
  If "light" → document.documentElement.classList.remove("dark")

  WHY the html element?
  Tailwind watches for .dark on <html>
  When .dark is present: dark: variants activate
  e.g. dark:bg-gray-800 only applies when .dark is on <html>
      │
      ▼
Any component can now use:
  const { isDark, toggleTheme } = useTheme()

User clicks the moon/sun button in sidebar:
  toggleTheme() →
    flip state: "light" → "dark"
    applyTheme("dark")
    localStorage.setItem("aura_theme", "dark")
    Page instantly goes dark, preference saved forever ✓
```

---

## `contexts/AuthContext.tsx` — Global Login State

> Historical note: the localStorage diagram in this older section describes the pre-proxy implementation. The current HTTP-only-cookie flow is documented in "Current token-storage design" below.

### What it is
Stores "who is logged in" and shares it across the entire app.

### Why it exists
```
Without AuthContext:
  App loads → fetches user → needs to pass to:
    Layout → needs to pass to:
      Sidebar → needs to pass to:
        UserMenu → finally shows user name
  Every component in the chain must receive "user" as a prop
  Changing anything breaks the whole chain

With AuthContext:
  App loads → fetches user → stores globally
  Any component anywhere:
    const { user, logout } = useAuth()
  No prop passing needed. Clean. ✓
```

### The logic flow
```
App starts (any page load or browser refresh)
      │
      ▼
AuthContext initializes:
Is there a token in localStorage?
      │
      ├─ NO → user = null, isAuthenticated = false
      │        Redirect to /auth/login
      │
      └─ YES → Call GET /api/v1/auth/me
                "Backend, validate this token and tell me who I am"
                      │
                      ├─ TOKEN INVALID/EXPIRED
                      │   Remove token from localStorage
                      │   user = null
                      │   Redirect to login
                      │
                      └─ TOKEN VALID
                          user = { id, email, name }
                          isAuthenticated = true
                          Show dashboard ✓
      │
      ▼
Available to all components:
  user              — the logged-in user object
  isAuthenticated   — true/false
  logout()          — clears session and CSRF cookies, redirects to login
```

---

## `components/dashboard/DashboardLayout.tsx` — The Shell

### What it is
The persistent UI frame that wraps every dashboard page.
Contains: sidebar navigation, top header, theme toggle, user menu.

### Why it exists
Every dashboard page (Overview, Metrics, Insights, etc.) needs
the same sidebar and header. Without DashboardLayout, we'd have
to copy-paste that code into every single page. Instead:
```
DashboardLayout
  └─ wraps
       ├─ Overview page content
       ├─ Metrics page content
       ├─ Insights page content
       └─ Integrations page content
```

### The sidebar collapse logic
```
Desktop (screen width ≥ 768px):
  sidebarOpen = true  → sidebar shows at 256px width (w-64)
  sidebarOpen = false → sidebar collapses to 80px width (w-20)
                        only icons visible, no text
  Toggle: X button in sidebar header

Mobile (screen width < 768px):
  Sidebar is HIDDEN by default (translate-x-full = off screen left)
  mobileOpen = true  → slides in from left (translate-x-0)
  mobileOpen = false → slides out to left
  Dark overlay appears behind sidebar when open
  Clicking overlay closes sidebar
  Toggle: hamburger menu button (☰) in top header
```

### Active route highlighting
```
usePathname() reads current URL
"/dashboard/integrations"

For each menu item:
  isActive = (pathname === item.href)

  If active:   bg-blue-50 dark:bg-blue-950 text-blue-600
  If inactive: text-gray-600 hover:bg-gray-100

This gives the blue highlight to the current page's nav item
```

---

## `lib/api.ts` — The Communication Layer

### What it is
Every function the frontend uses to talk to the backend.
One central place for all HTTP calls.

### Why it exists
```
WITHOUT api.ts (messy):
  PageA.tsx:
    fetch("https://aura-backend.onrender.com/api/v1/brands", {
      headers: { Authorization: `Bearer ${localStorage.getItem("aura_token")}` }
    })

  PageB.tsx:
    fetch("https://aura-backend.onrender.com/api/v1/brands", {
      headers: { Authorization: `Bearer ${localStorage.getItem("aura_token")}` }
    })

  Problems:
    URL duplicated everywhere
    Token logic duplicated everywhere
    Change the URL → update 20 files

WITH api.ts (clean):
  PageA.tsx: getBrands()
  PageB.tsx: getBrands()

  Benefits:
    One place to change the URL
    Token automatically added to every request
    Consistent error handling
```

### Current token-storage design

Aura now uses a same-origin Next.js proxy. Browser JavaScript calls `/api/v1`, while the Next.js server reads the HTTP-only `aura_session` cookie and adds the `Authorization: Bearer` header only when it forwards a request to the Render backend.

State-changing proxy requests require both a matching CSRF cookie/header and a same-origin request. The cookie migration is not deployed until `BACKEND_API_URL` and database migration 003 are configured and browser-tested.

### Historical apiFetch base function (replaced)
```
apiFetch(endpoint, options)
      │
      ▼
Read JWT token from localStorage
"aura_token" → "eyJhbGc..."
      │
      ▼
Build request headers:
  Content-Type: application/json
  Authorization: Bearer eyJhbGc...
      │
      ▼
Call fetch() with:
  Full URL: https://aura-backend.../api/v1 + endpoint
  Method: GET/POST/DELETE
  Headers: above
  Body: JSON.stringify(data) if provided
      │
      ▼
Return the Response object
Caller does: const data = await response.json()
```

### Historical API functions (replaced)
```
loginUser(email, password)
  → POST /auth/login
  → Saves token + user to localStorage

getBrands()
  → GET /brands (with auth header)
  → Returns array of user's brands

getShopifyStatus(brandId)
  → GET /integrations/shopify/status?brandId=...
  → Returns { connected: true/false, integration: {...} }

getMetricsSummary(brandId)
  → GET /metrics/summary?brandId=...
  → Returns KPI totals + % change vs previous period

getMetricsChart(brandId, metric, days)
  → GET /metrics/chart?brandId=...&metric=revenue&days=30
  → Returns array of daily data points for Recharts
```

---

## `app/dashboard/page.tsx` — The Overview Dashboard

### What it is
The main dashboard page. Shows KPI cards, the area chart, and quick stats.
The "homepage" of the app after login.

### Why it's complex
This page has to:
1. Fetch brands on load
2. Auto-select the first brand
3. When brand changes, fetch that brand's metrics
4. Show skeleton loading while data loads
5. Render 4 KPI cards with real numbers
6. Render an interactive area chart
7. Support dark mode throughout
8. Handle errors gracefully

### The state and data flow
```
Page mounts (user navigates to /dashboard)
      │
      ▼
useEffect #1: loadBrands()
  Call getBrands() → fetch from backend
  Set brands state = [{ id, name, ... }]
  Auto-select first brand → setSelectedBrand(brands[0])
      │
      ▼
useEffect #2: watches selectedBrand
  When selectedBrand changes → loadMetrics(brandId)
      │
      ▼
loadMetrics(brandId):
  setIsLoading(true) → skeleton cards appear
      │
      ▼
Promise.all([
  getMetricsSummary(brandId),    ← runs simultaneously
  getMetricsChart(brandId, "revenue", 30),  ←    ↑
  getMetricsChart(brandId, "orders",  30),  ← all 3 at once
])
WHY Promise.all: Parallel requests = 3x faster
                 Instead of waiting for each one sequentially

All 3 complete:
  setSummary(summaryData)      → KPI cards update
  setRevenueChart(revenueData) → area chart updates
  setOrdersChart(ordersData)
  setIsLoading(false)          → skeleton disappears
      │
      ▼
Render KPI cards with real data:
  Revenue:       $38,913.54   (+18.52% vs last 30 days) ↗
  Orders:        436          (+8.46%)  ↗
  Avg Order Val: $89.25       (+9.27%)  ↗
  New Customers: 148          (+9.63%)  ↗

Render AreaChart:
  chartData = revenueChart or ordersChart (based on toggle)
  Each point: { date: "Feb 4", value: 1231.16 }
  Recharts draws the smooth blue line with gradient fill
```

### Dark mode in charts
```
Problem: Recharts colors are set in JSX, not CSS
         Can't use Tailwind dark: classes on SVG elements
         Can't do: stroke="dark:white"

Solution: Read isDark from ThemeContext
          Compute colors as JavaScript variables:

  const gridColor = isDark ? "#374151" : "#f0f0f0"
  const tickColor = isDark ? "#9ca3af" : "#6b7280"

  Use these variables in chart props:
  <CartesianGrid stroke={gridColor} />
  <XAxis tick={{ fill: tickColor }} />

When theme toggles:
  isDark changes → component re-renders → new colors applied
```

---

# HOW EVERYTHING CONNECTS — THE FULL PICTURE

```
USER OPENS DASHBOARD
        │
        ▼
AuthContext checks localStorage for token
        │
        ├─ No token → redirect to /auth/login
        │
        └─ Has token → verify with backend → show dashboard
                               │
                               ▼
DashboardLayout renders:
  Sidebar (with dark mode toggle)
  Header (with user name from AuthContext)
  Page content (from the current route)
                               │
                               ▼
dashboard/page.tsx mounts:
  Calls getBrands() via lib/api.ts
                               │
                               ▼
lib/api.ts:
  Reads token from localStorage
  Calls GET https://aura-backend.../api/v1/brands
  Attaches Authorization: Bearer token
                               │
                               ▼
Express server receives request:
  Runs through middleware chain
  Route matches /api/v1/brands
  protect middleware verifies JWT
  brands.controller.ts: getBrands()
  Queries PostgreSQL: SELECT * FROM brands WHERE user_id=?
  Returns brands array
                               │
                               ▼
lib/api.ts returns brands to dashboard/page.tsx
page.tsx: setBrands(data), setSelectedBrand(data[0])
                               │
                               ▼
useEffect triggers: loadMetrics(brand.id)
  3 parallel calls to metrics API
  metrics.controller.ts queries metrics table
  Calculates totals, % changes, chart points
  Returns to frontend
                               │
                               ▼
page.tsx: setSummary, setCharts, setIsLoading(false)
Recharts renders the area chart
KPI cards show real numbers
Dashboard is fully loaded ✓
```

---

# KEY CONCEPTS SUMMARY

| Concept | What it is | Why we need it |
|---|---|---|
| Middleware | Code that runs on every request | Auth checks, logging, security |
| JWT Token | Signed proof of identity | Login without server-side sessions |
| OAuth 2.0 | Login via Shopify | Access their store without their password |
| HMAC | Cryptographic signature | Verify Shopify callbacks are genuine |
| CSRF State | Random token in OAuth flow | Prevent forged OAuth callbacks |
| Context | Global state in React | Share data without prop drilling |
| Suspense | Deferred rendering | Allow Next.js build-time pre-rendering |
| Upsert | Insert OR Update | Handle duplicate data safely |
| Connection Pool | Reuse DB connections | Faster, more efficient queries |
| Cron Job | Scheduled task | Automatic daily data sync |
| Promise.all | Parallel async calls | Fetch multiple things simultaneously |
| Seed Data | Realistic fake data | Demo/develop without real API access |
| Dark variants | dark:bg-gray-800 | Tailwind dark mode styling |
| ThemeContext | Global theme state | Consistent dark mode everywhere |

---

## `app/dashboard/layout.tsx` — Protected Dashboard Route Guard

This client layout runs before Aura renders any dashboard page. It waits for `AuthContext` to finish checking the HTTP-only session cookie. If there is no authenticated user, it uses `router.replace('/auth/login')` to redirect before dashboard pages can start protected data requests.

`children: React.ReactNode` represents whichever dashboard page is nested inside the layout. When a user is authenticated, the layout returns those children unchanged.

# How to keep this guide accurate

This guide was generated from manual documentation, not from a fresh repository scan. For every real source file, Codex should add:

1. The exact file path.
2. Its imports and why each dependency is needed.
3. Its exported functions, components, types, and constants.
4. A line-by-line or logical-block explanation.
5. Inputs, outputs, side effects, and failure cases.
6. Which files call it and which files it calls.
7. A small beginner exercise that modifies the file safely.

Use the template below.

```md
## `path/to/file.ts`

### Purpose

### Imports

| Import | Comes from | Why it is needed |
|---|---|---|

### Types and interfaces

### Functions or components

### Execution order

### Line-by-line explanation

| Lines | Code | Plain-English meaning | Syntax lesson |
|---|---|---|---|

### Inputs and outputs

### Side effects

### Possible errors

### Files connected to this file

### Beginner exercise
```
