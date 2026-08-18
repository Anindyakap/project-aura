# Project Aura

**D2C Growth Co-pilot Dashboard**

Aura is a work-in-progress analytics application for direct-to-consumer brands. It has a Next.js frontend, an Express API, and a PostgreSQL database. The [master checklist](./docs/01_MASTER_CHECKLIST.md) is the source of truth for what is verified, in progress, and planned.

## Product direction

The long-term product direction includes Shopify, Meta Ads, and Google Ads integrations, marketing insights, alerts, and workflow automation. Not every item in this list is implemented today; check the master checklist before treating a feature as complete.

## Tech stack

**Frontend**

- Next.js 15
- React 19 and TypeScript
- Tailwind CSS v4
- Radix UI and Recharts

**Backend**

- Node.js, Express, and TypeScript
- PostgreSQL (Supabase)
- Vitest for automated backend tests

**Deployment**

- Vercel for the frontend
- Render for the backend

## Repository layout

```text
project-aura/
|- app/              Next.js routes, layouts, global styles, and local fonts
|- components/       Reusable UI and dashboard components
|- contexts/         Shared React authentication and theme state
|- lib/              Frontend API client and utility functions
|- backend/          Separate Express API application
|  `- src/           API routes, controllers, services, middleware, and utilities
|- database/         Database migrations and schema material
|- docs/             Checklist and project documentation
|- render.yaml       Render backend deployment configuration
`- package.json      Frontend scripts and dependencies
```

The frontend does not import backend server code directly. Browser code in `app/`, `components/`, and `contexts/` calls the Express API through `lib/api.ts`. The backend then validates requests, applies business rules, and queries PostgreSQL.

## Run Aura locally

Use two terminals: one for the frontend and one for the backend.

### Frontend

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Backend

```bash
cd backend
npm install
npm run dev
```

The backend development server uses its own `backend/package.json` and reads its own local environment file.

## Environment variables and security

Start from `.env.example` for the frontend and `backend/.env.example` for the backend. Copy them to ignored local environment files and replace placeholders with your own values.

Never commit database URLs, JWT secrets, Shopify client secrets, passwords, or tokens. Values beginning with `NEXT_PUBLIC_` are visible to browser users and must not contain secrets. See [the environment-variable reference](./docs/09_ENVIRONMENT_VARIABLES.md) for names and deployment locations.

## Documentation

- [Master checklist](./docs/01_MASTER_CHECKLIST.md)
- [Project summary](./docs/02_PROJECT_SUMMARY.md)
- [Codebase guide](./docs/03_CODEBASE_GUIDE.md)
- [Scripts and commands](./docs/07_SCRIPTS_AND_COMMANDS_GUIDE.md)

## License

MIT. See [LICENSE](./LICENSE).
