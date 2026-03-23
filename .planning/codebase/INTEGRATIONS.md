# External Integrations

**Analysis Date:** 2026-03-23

## APIs & External Services

**Sales Data API:**
- Apollo.io - Company discovery for preview snapshots
  - SDK/Client: native `fetch` in `src/lib/apollo/company-search.ts`
  - Auth: `APOLLO_API_KEY`
  - Endpoint: `https://api.apollo.io/api/v1/mixed_companies/search`
- Apollo.io - People discovery scoped to selected company IDs
  - SDK/Client: native `fetch` in `src/lib/apollo/people-search.ts`
  - Auth: `APOLLO_API_KEY`
  - Endpoint: `https://api.apollo.io/api/v1/mixed_people/api_search`
- Apollo.io - Usage telemetry before search execution
  - SDK/Client: native `fetch` in `src/features/usage/lib/apollo-usage.ts`
  - Auth: `APOLLO_API_KEY`
  - Endpoint: `https://api.apollo.io/api/v1/usage_stats/api_usage_stats`

## Data Storage

**Databases:**
- Postgres schema definitions via Drizzle are present but inactive
  - Connection: `DATABASE_URL`
  - Client: Not implemented. `src/lib/db/schema/recipes.ts` and `src/lib/db/schema/company-snapshots.ts` define tables, but there is no Drizzle database instance or query layer in the current codebase.

**File Storage:**
- Local filesystem only
  - Recipes persist to `data/recipes.json` through `src/lib/db/repositories/recipes.ts`
  - Company snapshots persist to `data/company-snapshots.json` through `src/lib/db/repositories/company-snapshots.ts`
  - People snapshots persist to `data/people-snapshots.json` through `src/lib/db/repositories/people-snapshots.ts`
  - Run plans persist to `data/run-plans.json` through `src/lib/db/repositories/run-plans.ts`
  - Base path management lives in `src/lib/db/client.ts`
  - `RECIPE_DATA_FILE` can override only the recipe file path in `src/lib/db/client.ts`

**Caching:**
- None
  - Apollo requests use `cache: "no-store"` in `src/lib/apollo/company-search.ts`, `src/lib/apollo/people-search.ts`, and `src/features/usage/lib/apollo-usage.ts`
  - Reuse behavior is implemented as persisted snapshot lookup, not cache middleware, in `src/app/api/company-search/route.ts`

## Authentication & Identity

**Auth Provider:**
- Custom single-user, no end-user auth layer
  - Implementation: Server-side access is gated only by possession of `APOLLO_API_KEY` in `src/lib/env.ts`; no session, OAuth, or role-based identity package is present.

## Monitoring & Observability

**Error Tracking:**
- None
  - No Sentry, PostHog, Datadog, or similar SDK import was detected.

**Logs:**
- Default thrown errors only
  - Apollo failures throw plain `Error` objects in `src/lib/apollo/company-search.ts` and `src/lib/apollo/people-search.ts`
  - Usage failures are converted into user-facing status payloads in `src/features/usage/lib/apollo-usage.ts`
  - No structured logger is wired.

## CI/CD & Deployment

**Hosting:**
- Not detected from repository config
  - No Vercel config, Dockerfile, GitHub Actions workflow, or deployment manifest was found.

**CI Pipeline:**
- None detected

## Environment Configuration

**Required env vars:**
- `APOLLO_API_KEY` - Required for live Apollo company search, people search, and usage telemetry in `src/lib/apollo/company-search.ts`, `src/lib/apollo/people-search.ts`, and `src/features/usage/lib/apollo-usage.ts`
- `DATABASE_URL` - Declared in `.env.example` and validated in `src/lib/env.ts`, but currently unused by active repositories
- `RECIPE_DATA_FILE` - Optional override for the recipe JSON path in `src/lib/db/client.ts`

**Secrets location:**
- Local env files are expected. `.env.example` documents the variable names, and `.env.local` is present.

## Webhooks & Callbacks

**Incoming:**
- None
  - The only Route Handlers are `src/app/api/company-search/route.ts`, `src/app/api/people-search/route.ts`, and `src/app/api/apollo/usage/route.ts`, all initiated by the app itself.

**Outgoing:**
- Apollo REST API calls only
  - `src/lib/apollo/company-search.ts`
  - `src/lib/apollo/people-search.ts`
  - `src/features/usage/lib/apollo-usage.ts`

## Integration Behavior Notes

**Fixture fallback:**
- When `APOLLO_API_KEY` is missing, Apollo integrations switch to deterministic fixture responses instead of failing hard
  - Company fixtures are returned by `getFixtureResult` in `src/lib/apollo/company-search.ts`
  - People fixtures are returned by `getFixtureResult` in `src/lib/apollo/people-search.ts`
  - Usage telemetry returns a `missing_key` summary in `src/features/usage/lib/apollo-usage.ts`

**Internal integration boundaries:**
- Browser code does not call Apollo directly
  - Route Handlers expose server endpoints in `src/app/api/company-search/route.ts`, `src/app/api/people-search/route.ts`, and `src/app/api/apollo/usage/route.ts`
  - Server Actions also orchestrate Apollo plus persistence in `src/app/recipes/actions.ts`

---

*Integration audit: 2026-03-23*
