# Project Aura — Scripts and Commands Guide

## Important distinction

A **source file** such as `server.ts` contains application logic. A **package script** is a named command in `package.json`, usually run with `npm run <name>`.

The supplied manuals explain several source files, but they do not provide the current `package.json` files. Therefore, the exact list of scripts must be verified from the repository before this document is treated as complete.

## How npm scripts work

Example:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  }
}
```

Run one with:

```bash
npm run dev
```

`npm` looks inside `package.json`, finds the `dev` entry, and executes the command on the right.

## Common frontend scripts

| Script | Typical command | Purpose |
|---|---|---|
| `dev` | `next dev` | Start a development server with fast reloads. |
| `build` | `next build` | Compile and optimize the production application. |
| `start` | `next start` | Run the already-built production application. |
| `lint` | `eslint .` | Find suspicious code and style problems. |
| `typecheck` | `tsc --noEmit` | Check TypeScript without creating JavaScript output. |
| `test` | test-runner command | Run automated tests. |
| `format` | `prettier --write .` | Rewrite supported files into the agreed format. |

## Common backend scripts

| Script | Typical command | Purpose |
|---|---|---|
| `dev` | `tsx watch src/server.ts` | Run the TypeScript server and restart after changes. |
| `build` | `tsc` | Compile TypeScript into JavaScript, often in `dist/`. |
| `start` | `node dist/server.js` | Run the compiled production server. |
| `lint` | `eslint .` | Check backend source quality. |
| `typecheck` | `tsc --noEmit` | Validate types without compiling output. |
| `test` | test-runner command | Run backend tests. |
| `seed` | `tsx src/scripts/seed-metrics.ts` | Insert demonstration data. |

These are examples, not confirmed Aura commands.

## Documented Aura source scripts and jobs

### `backend/src/server.ts`

Starts the backend process, registers middleware and routes, connects to PostgreSQL, and registers scheduled jobs.

### `backend/src/jobs/sync.jobs.ts`

Registers the recurring cron schedule. The documented cron expression `0 0 * * *` means every day at midnight UTC.

### `backend/src/services/shopify.sync.ts`

Fetches Shopify orders, handles pagination, converts order data into Aura metrics, and saves those metrics.

### `seed-metrics.ts`

Creates realistic demonstration metrics. It is useful when a live external platform cannot yet provide data.

### `insights.engine.ts`

Loads recent metrics, compares two periods, applies rules, and creates or updates insight records.

## What build-related commands actually do

### Development server

```bash
npm run dev
```

Use this while coding. It is optimized for feedback, not production speed.

### Type-check

```bash
npm run typecheck
```

This asks TypeScript to verify that values are used correctly. It should catch mistakes such as passing a string where a number is required.

### Lint

```bash
npm run lint
```

Linting checks code patterns that are legal but may be dangerous, inconsistent, or hard to maintain.

### Test

```bash
npm test
```

Tests execute prepared examples and verify that actual results match expected results.

### Production build

```bash
npm run build
```

This is stricter than merely opening the site in development. It compiles the production application and can reveal routing, typing, server/client, or optimization errors.

### Production start

```bash
npm run start
```

This runs output already produced by the build. It generally does not compile source code.

## Codex audit prompt for exact scripts

```text
Inspect every package.json in this repository. Create a table containing each script name, its exact command, which package it belongs to, what the command does step by step, when I should run it, what files it reads or creates, and common failure messages. Do not guess. Update 07_SCRIPTS_AND_COMMANDS_GUIDE.md with the verified result.
```
