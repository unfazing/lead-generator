# Technology Stack

**Analysis Date:** 2026-03-23

## Languages

**Primary:**
- TypeScript 5.9.2 - Application code across `src/app`, `src/features`, and `src/lib`, configured in `tsconfig.json`.

**Secondary:**
- CSS - Global styling in `src/app/globals.css`.
- JSON - Package metadata in `package.json`, lockfile state in `package-lock.json`, and runtime data snapshots in `data/*.json`.

## Runtime

**Environment:**
- Node.js runtime via Next.js server rendering, Route Handlers, and Server Actions in `src/app/api/*.ts` and `src/app/recipes/actions.ts`.
- Next.js App Router 15.5.2 with React 19.1.1 from `package.json`.

**Package Manager:**
- npm - `package-lock.json` is present, so npm is the active package manager.
- Lockfile: present in `package-lock.json`

## Frameworks

**Core:**
- Next.js 15.5.2 - Full-stack framework for App Router pages, Route Handlers, redirects, and Server Actions in `src/app/layout.tsx`, `src/app/search/page.tsx`, `src/app/api/company-search/route.ts`, and `src/app/recipes/actions.ts`.
- React 19.1.1 - UI layer for feature components under `src/features/**`.
- Zod 4.1.5 - Runtime validation for env, search payloads, and recipe schemas in `src/lib/env.ts`, `src/lib/company-search/schema.ts`, `src/lib/people-search/schema.ts`, and `src/lib/recipes/schema.ts`.

**Testing:**
- Not detected. `package.json` contains no test script, and no `vitest.config.*`, `jest.config.*`, or Playwright config is present.

**Build/Dev:**
- TypeScript 5.9.2 - Strict type checking in `tsconfig.json` and `npm run typecheck`.
- ESLint 9.35.0 with Next flat config - Linting in `eslint.config.mjs` and `npm run lint`.
- Prettier 3.6.2 - Installed via `package.json`; no explicit `.prettierrc` file detected.
- Tailwind CSS 4.1.12 - Styling via `@import "tailwindcss";` in `src/app/globals.css` and PostCSS plugin setup in `postcss.config.mjs`.
- PostCSS 8.5.6 with `@tailwindcss/postcss` - CSS build pipeline in `postcss.config.mjs`.

## Key Dependencies

**Critical:**
- `next@15.5.2` - Application runtime and routing backbone in `package.json`.
- `react@19.1.1` and `react-dom@19.1.1` - Component rendering for `src/features/**`.
- `zod@4.1.5` - Boundary validation before Apollo requests and file-backed persistence writes in `src/lib/env.ts`, `src/lib/company-search/schema.ts`, `src/lib/people-search/schema.ts`, and `src/lib/recipes/schema.ts`.

**Infrastructure:**
- `drizzle-orm@0.44.5` - Present and used only for Postgres table definitions in `src/lib/db/schema/recipes.ts` and `src/lib/db/schema/company-snapshots.ts`; no live Drizzle client or queries are wired in the current codebase.
- `@eslint/js`, `eslint-config-next`, `eslint-config-prettier` - Linting stack in `eslint.config.mjs`.
- `tailwindcss`, `postcss`, `@tailwindcss/postcss` - Styling toolchain in `postcss.config.mjs` and `src/app/globals.css`.

## Configuration

**Environment:**
- Environment validation is centralized in `src/lib/env.ts` using Zod.
- Required for live Apollo access: `APOLLO_API_KEY`, declared in `.env.example` and consumed by `src/lib/apollo/company-search.ts`, `src/lib/apollo/people-search.ts`, and `src/features/usage/lib/apollo-usage.ts`.
- Optional database connection placeholder: `DATABASE_URL`, declared in `.env.example` and validated in `src/lib/env.ts`, but not used by any active repository or DB client.
- Optional file-backed recipe path override: `RECIPE_DATA_FILE`, declared in `.env.example` and consumed by `src/lib/db/client.ts`.
- `.env.local` exists. Its contents were not read.

**Build:**
- TypeScript config: `tsconfig.json`
- Next config: `next.config.ts`
- ESLint config: `eslint.config.mjs`
- PostCSS config: `postcss.config.mjs`
- Package manifest and scripts: `package.json`

## Platform Requirements

**Development:**
- Node.js version is not pinned; no `.nvmrc`, `.node-version`, or `engines` field was detected.
- npm install is expected because `package-lock.json` is committed.
- Writable local filesystem is required for JSON persistence under `data/`, as used by `src/lib/db/repositories/recipes.ts`, `src/lib/db/repositories/company-snapshots.ts`, `src/lib/db/repositories/people-snapshots.ts`, and `src/lib/db/repositories/run-plans.ts`.

**Production:**
- Deployment target is a Node-capable Next.js server environment, not static export. Server execution is required for Route Handlers in `src/app/api/company-search/route.ts`, `src/app/api/people-search/route.ts`, and `src/app/api/apollo/usage/route.ts`.
- Current persistence assumes a durable writable filesystem for `data/*.json`. The codebase is not currently wired to use `DATABASE_URL`, so stateless/serverless hosting would lose recipe and snapshot state unless the persistence layer is replaced.

---

*Stack analysis: 2026-03-23*
