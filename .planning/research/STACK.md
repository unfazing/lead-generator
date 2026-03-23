# Stack Research

**Domain:** Apollo API-powered single-user lead-generation web app
**Researched:** 2026-03-23
**Confidence:** HIGH

## Recommended Stack

This should be a server-rendered TypeScript web app, not a browser-only client. Apollo API keys, usage stats, cost estimation logic, and export orchestration belong on the server so the app can gate requests, batch enrichment, and keep credit usage visible and enforceable.

### Core Technologies

| Technology | Version | Purpose | Why Recommended | Confidence |
|------------|---------|---------|-----------------|------------|
| Node.js | 24 LTS | Runtime for app server, jobs, and tooling | Node 24 is the current Active LTS line. For a 2026 greenfield app, it is the stable default and avoids starting on a maintenance branch. | HIGH |
| Next.js | 15.5.2 | Full-stack web framework | This is the standard React full-stack choice in 2026 for internal tools: App Router, Route Handlers, Server Components, and server-only env handling fit an Apollo orchestration app well. | HIGH |
| React + React DOM | 19.1.1 | UI layer | React 19 is the current stable pairing for Next 15. It keeps you on the mainstream ecosystem path with no framework mismatch. | HIGH |
| TypeScript | 5.9.2 | End-to-end type safety | You will be stitching together Apollo filters, job state, cost-estimation inputs, CSV schemas, and DB models. Strong typing reduces the exact class of silent data-shape bugs this app is prone to. | HIGH |
| PostgreSQL | 17 | Primary database for recipes, runs, job state, usage snapshots, and exports | Postgres is the standard default for workflow-heavy internal apps. It gives durable state, transactions, JSONB for Apollo payload snapshots, and no reinvention around queues or export history. | MEDIUM |
| Neon | Postgres 17 managed service | Managed Postgres hosting | For a single-user app, Neon is the cleanest managed Postgres fit: low ops burden, branching if needed, and first-class support for serverless access patterns. | MEDIUM |
| Drizzle ORM | 0.44.5 | SQL-first ORM and query builder | This app needs predictable SQL tables for recipes, runs, selected companies, enrichment attempts, and credit ledgers. Drizzle stays close to SQL, works cleanly with Postgres and serverless drivers, and is lighter than Prisma for this scope. | HIGH |
| drizzle-kit | 0.31.4 | Schema migrations | Use Drizzle's migration tool with the ORM. It keeps schema changes explicit and avoids ad hoc SQL drift. | HIGH |
| Inngest | 3.40.2 | Durable background orchestration | Apollo workflows are exactly the kind of work that should not run in a single request: paginated search, batch enrichment, retries, throttling, and idempotent resume. Inngest gives concurrency and throttling controls without making you run Redis or a worker cluster. | HIGH |
| Tailwind CSS | 4.1.12 | UI styling | For an internal tool with dense filters, tables, badges, and run-status views, Tailwind is still the fastest path to a usable operator UI without committing to a heavyweight component framework. | MEDIUM |

### Supporting Libraries

| Library | Version | Purpose | When to Use | Confidence |
|---------|---------|---------|-------------|------------|
| @neondatabase/serverless | 1.0.1 | Serverless Postgres driver | Use this if deploying on Vercel or another serverless platform. It matches the Neon recommendation and avoids TCP assumptions. | HIGH |
| postgres | 3.4.7 | Long-lived Postgres driver | Use this instead of the Neon serverless driver if you self-host a long-running Node process or container. | HIGH |
| zod | 4.1.5 | Runtime validation for Apollo inputs and persisted configs | Use on every boundary: form payloads, saved recipes, Apollo response normalization, CSV row schemas, and env validation. | HIGH |
| react-hook-form | 7.62.0 | Filter and recipe forms | Use for the dense company/person filter forms where uncontrolled inputs and low rerender cost matter. | MEDIUM |
| @tanstack/react-query | 5.87.1 | Client cache for usage stats, run status, and preview data | Use for polling run progress, revalidating usage/cost views, and keeping the UI snappy without hand-rolled fetch state. | HIGH |
| @tanstack/react-table | 8.21.3 | Company and people result tables | Use for sortable selectable grids, especially manual company-selection mode before enrichment. | HIGH |
| csv-stringify | 6.6.0 | CSV export generation | Use server-side for deterministic, stream-friendly CSV output. This is safer than building CSV strings manually. | HIGH |
| pino | 9.9.4 | Structured logging | Use for every Apollo request, run step, retry, and export event so you can debug credit spend and failed enrichments from logs. | HIGH |

### Development Tools

| Tool | Purpose | Notes | Confidence |
|------|---------|-------|------------|
| pnpm 10.15.1 | Package management | Fast, space-efficient, and the sensible default for a modern TypeScript app. | MEDIUM |
| eslint-config-next 15.5.2 | Linting baseline | Use the Next flat-config path, not legacy `next lint`. Next 16 docs explicitly note `next lint` removal, so set up ESLint CLI directly from the start. | HIGH |
| eslint-config-prettier 10.1.8 | Disable formatting-rule conflicts | Keep linting and formatting separate. Do not run Prettier through ESLint. | HIGH |
| prettier 3.6.2 | Formatting | Standardize formatting early because this app will accumulate schema, API, and UI code quickly. | HIGH |
| vitest 3.2.4 | Unit and integration tests | Use for cost-estimation logic, Apollo request builders, CSV mappers, and data normalization. | HIGH |
| @playwright/test 1.55.0 | End-to-end tests | Use for the full operator flow: filters -> preview -> run -> monitor -> export. | MEDIUM |

## Installation

```bash
# Core
pnpm add next@15.5.2 react@19.1.1 react-dom@19.1.1 typescript@5.9.2 \
  drizzle-orm@0.44.5 zod@4.1.5 inngest@3.40.2 tailwindcss@4.1.12 \
  @tanstack/react-query@5.87.1 @tanstack/react-table@8.21.3 \
  react-hook-form@7.62.0 csv-stringify@6.6.0 pino@9.9.4

# Database driver: pick one
pnpm add @neondatabase/serverless@1.0.1
# or
pnpm add postgres@3.4.7

# Dev dependencies
pnpm add -D drizzle-kit@0.31.4 eslint-config-next@15.5.2 \
  eslint-config-prettier@10.1.8 prettier@3.6.2 vitest@3.2.4 \
  @playwright/test@1.55.0 @types/node
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Next.js 15.5.2 | Remix | Use Remix only if you strongly prefer its loader/action model and are intentionally avoiding the Next ecosystem. For this app, Next has the larger 2026 ecosystem center of gravity. |
| Drizzle ORM 0.44.5 | Prisma ORM 6 | Use Prisma only if the project grows into a broader multi-user CRUD product with heavier relational abstraction needs and a team already standardized on Prisma. |
| Inngest 3.40.2 | Trigger.dev | Use Trigger.dev if you want a more task-centric hosted runner and prefer its operational model. For Apollo rate-limited pipelines, Inngest's flow-control primitives are the cleaner fit. |
| Neon Postgres 17 | Turso / SQLite | Use Turso only if you want the absolute lightest single-user persistence model and you are confident the app will stay small. For job state, ledgers, and export history, Postgres is the safer default. |
| Tailwind CSS 4.1.12 | shadcn/ui-style component layer | Add a component layer if UI speed becomes the bottleneck. Start with Tailwind alone so the tool stays small and deliberate. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Pure client-side React SPA calling Apollo directly | This leaks the Apollo API key into the browser and makes request throttling, batching, and credit controls unenforceable. | Next.js Route Handlers, Server Actions, and background functions |
| Edge runtime as the default execution target | Apollo orchestration, DB access, CSV generation, and long-running retries are a Node-server concern. Edge is the wrong default here. | Node.js runtime for all Apollo, DB, and export paths |
| BullMQ or a Redis-backed worker stack for v1 | Extra infra for a single-user app is unnecessary and slows delivery. You do not need Redis just to run paginated API jobs. | Inngest |
| Prisma as the default ORM for this project | Good product, wrong fit. This app benefits more from SQL-near schemas and simple migrations than from a heavier generated-client workflow. | Drizzle ORM |
| Browser localStorage as the primary source of recipes or run history | Recipes, usage snapshots, exports, and run resumes need durability and queryability. | PostgreSQL |

## Stack Patterns by Variant

**If deploying on Vercel or another serverless host:**
- Use `@neondatabase/serverless` with Neon.
- Keep Apollo calls and CSV export generation on the Node runtime, not Edge.
- Use Inngest for all multi-step runs, pagination, retries, and throttling.

**If self-hosting a single Node container behind a reverse proxy:**
- Use `postgres@3.4.7` instead of the Neon serverless driver.
- Keep the same Next.js + Postgres + Drizzle + Inngest architecture.
- Add Nginx or equivalent in front of Next.js, matching current Next self-hosting guidance.

**If you later add Apollo waterfall enrichment:**
- Keep Inngest.
- Add a public HTTPS webhook endpoint and make it idempotent.
- Store webhook receipts and final enrichment outcomes in Postgres before updating run state.

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| `next@15.5.2` | `react@19.1.1`, `react-dom@19.1.1` | Current stable pairing from package metadata. |
| `drizzle-orm@0.44.5` | `drizzle-kit@0.31.4` | Standard Drizzle pairing for schema + migration workflow. |
| `@tanstack/react-query@5.87.1` | `react@19.1.1` | Mainstream React 19-compatible query stack. |
| `Node.js 24 LTS` | `next@15.5.2` | Recommended runtime line for a 2026 greenfield app. |

## Sources

- https://docs.apollo.io/reference/organization-search — verified Apollo company search endpoint, credit use, and paging limits. Confidence: HIGH
- https://docs.apollo.io/reference/people-api-search — verified people search endpoint, master-key requirement, and no-credit search behavior. Confidence: HIGH
- https://docs.apollo.io/reference/people-enrichment — verified enrichment behavior, verified email status fields, webhook behavior, and credit implications. Confidence: HIGH
- https://docs.apollo.io/reference/bulk-people-enrichment — verified batch enrichment up to 10 people per request. Confidence: HIGH
- https://docs.apollo.io/reference/view-api-usage-stats — verified API usage and rate-limit endpoint. Confidence: HIGH
- https://nextjs.org/docs/app/building-your-application/routing/route-handlers — verified Route Handlers for server-side API orchestration. Confidence: HIGH
- https://nextjs.org/docs/app/guides/self-hosting — verified current self-hosting guidance and reverse-proxy recommendation. Confidence: HIGH
- https://nextjs.org/docs/app/api-reference/config/eslint — verified current ESLint setup guidance and `next lint` removal note in Next 16 docs. Confidence: HIGH
- https://www.npmjs.com/package/next — verified `next@15.5.2`. Confidence: HIGH
- https://www.npmjs.com/package/react — verified `react@19.1.1`. Confidence: HIGH
- https://www.npmjs.com/package/react-dom — verified `react-dom@19.1.1`. Confidence: HIGH
- https://www.npmjs.com/package/typescript?activeTab=code — verified `typescript@5.9.2`. Confidence: HIGH
- https://www.npmjs.com/package/drizzle-orm — verified `drizzle-orm@0.44.5`. Confidence: HIGH
- https://www.npmjs.com/package/drizzle-kit?activeTab=code — verified `drizzle-kit@0.31.4`. Confidence: HIGH
- https://www.npmjs.com/package/@neondatabase/serverless?activeTab=versions — verified `@neondatabase/serverless@1.0.1`. Confidence: HIGH
- https://www.npmjs.com/package/postgres — verified `postgres@3.4.7`. Confidence: HIGH
- https://www.inngest.com/docs — verified Inngest positioning for durable execution, retries, throttling, and observability. Confidence: HIGH
- https://www.inngest.com/docs/functions/concurrency — verified concurrency controls for third-party API rate limiting. Confidence: HIGH
- https://www.npmjs.com/package/inngest — verified `inngest@3.40.2`. Confidence: HIGH
- https://www.npmjs.com/package/zod — verified `zod@4.1.5`. Confidence: HIGH
- https://www.npmjs.com/package/react-hook-form — verified `react-hook-form@7.62.0`. Confidence: HIGH
- https://www.npmjs.com/package/%40tanstack/react-query — verified `@tanstack/react-query@5.87.1`. Confidence: HIGH
- https://www.npmjs.com/package/%40tanstack/react-table — verified `@tanstack/react-table@8.21.3`. Confidence: HIGH
- https://www.npmjs.com/package/csv-stringify — verified `csv-stringify@6.6.0`. Confidence: HIGH
- https://www.npmjs.com/package/pino — verified `pino@9.9.4`. Confidence: HIGH
- https://www.npmjs.com/package/tailwindcss — verified `tailwindcss@4.1.12`. Confidence: HIGH
- https://nodejs.org/about/previous-releases — verified Node 24 Active LTS status. Confidence: HIGH
- https://www.npmjs.com/package/pnpm — verified `pnpm@10.15.1`. Confidence: MEDIUM
- https://www.npmjs.com/package/eslint-config-next — verified `eslint-config-next@15.5.2`. Confidence: HIGH
- https://www.npmjs.com/package/eslint-config-prettier — verified `eslint-config-prettier@10.1.8`. Confidence: HIGH
- https://www.npmjs.com/package/prettier — verified `prettier@3.6.2`. Confidence: HIGH
- https://www.npmjs.com/package/vitest?activeTab=code — verified `vitest@3.2.4`. Confidence: HIGH
- https://www.npmjs.com/playwright — verified Playwright 1.55.0 package metadata; used here for `@playwright/test` version alignment with MEDIUM confidence. Confidence: MEDIUM

---
*Stack research for: Apollo API-powered single-user lead-generation web app*
*Researched: 2026-03-23*
