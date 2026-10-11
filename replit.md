# Xoftware

Xoftware Digital Indonesia is a storefront and account experience for digital products, merchant management, and messaging automation.

## Run & Operate

- Web preview: start the managed `artifacts/xftware: web` workflow. It runs `pnpm --filter @workspace/xoftware run dev` with the required `PORT` and `BASE_PATH` values and serves the packaged website export.
- Preview account pages (`/login` and `/owner`) send API and WebSocket traffic through the preview to `backend-s2.xoftware.id`; their functionality depends on that upstream service.
- Install workspace dependencies: `pnpm install --frozen-lockfile`
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Backend-only env: `DATABASE_URL` — Postgres connection string required to run the local API server; the public web preview does not require it.

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

_Populate as you build — short repo map plus pointers to the source-of-truth file for DB schema, API contracts, theme files, etc._

## Architecture decisions

_Populate as you build — non-obvious choices a reader couldn't infer from the code (3-5 bullets)._

## Product

_Describe the high-level user-facing capabilities of this app once they exist._

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
