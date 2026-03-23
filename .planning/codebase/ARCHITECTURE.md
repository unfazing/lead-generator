# Architecture

**Analysis Date:** 2026-03-23

## Pattern Overview

**Overall:** Next.js App Router monolith with server-rendered pages, server actions for primary mutations, thin API route wrappers, feature-organized UI, and file-backed repositories.

**Key Characteristics:**
- `src/app/search/page.tsx`, `src/app/search/company/page.tsx`, and `src/app/search/people/page.tsx` are async server components that load all page state directly from repositories and feature libs before rendering.
- Mutating user actions are centralized in `src/app/recipes/actions.ts`; forms in feature components post to these server actions instead of calling client-side fetch helpers.
- Shared business logic and integrations live under `src/lib/*`, while `src/features/*` contains UI assemblies and presentation helpers.

## Layers

**App Router / Entry Layer:**
- Purpose: Define routes, compose page-level data, and expose framework entry points.
- Location: `src/app`
- Contains: `page.tsx`, `layout.tsx`, route handlers in `src/app/api/*`, and server actions in `src/app/recipes/actions.ts`
- Depends on: `src/features/*`, `src/lib/db/repositories/*`, `src/features/usage/lib/apollo-usage.ts`, `src/lib/apollo/*`
- Used by: Next.js runtime

**Feature UI Layer:**
- Purpose: Render recipe editing, company snapshot review, people search controls, run planning, and usage display.
- Location: `src/features`
- Contains: Presentational and small stateful React components, plus feature-local helpers like `src/features/recipes/lib/recipe-form.ts` and `src/features/run-planning/lib/run-plan-estimates.ts`
- Depends on: Server actions in `src/app/recipes/actions.ts`, domain types from `src/lib/*`, and feature-local helpers
- Used by: Route pages such as `src/app/search/page.tsx`, `src/app/search/company/page.tsx`, and `src/app/search/people/page.tsx`

**Domain / Integration Layer:**
- Purpose: Define schemas, Apollo request/response normalization, environment parsing, and reusable search metadata.
- Location: `src/lib/apollo`, `src/lib/company-search`, `src/lib/people-search`, `src/lib/recipes`, `src/lib/env.ts`
- Contains: Zod schemas, filter definitions, Apollo fetch logic, search signature generation, and recipe type definitions
- Depends on: `zod`, Node crypto, `fetch`, `process.env`
- Used by: Server actions, API routes, repositories, and feature components

**Persistence Layer:**
- Purpose: Persist recipes, snapshots, and run plans in local JSON files under `data/`.
- Location: `src/lib/db/client.ts` and `src/lib/db/repositories/*`
- Contains: File-path resolution, data-directory creation, JSON read/write helpers, record selection, update/insert logic
- Depends on: Node `fs/promises`, Node `path`, `src/lib/env.ts`, and domain types from `src/lib/*`
- Used by: App pages and server actions

**Schema Scaffolding Layer:**
- Purpose: Hold persistence-related types and partial future database definitions.
- Location: `src/lib/db/schema`
- Contains: `RunPlanStatus` and `PeopleSnapshotSelectionMode` type aliases plus unused Drizzle table definitions in `src/lib/db/schema/recipes.ts` and `src/lib/db/schema/company-snapshots.ts`
- Depends on: `drizzle-orm/pg-core` in the table-definition files
- Used by: Repository type imports for `RunPlanStatus` and `PeopleSnapshotSelectionMode`; the table definitions are not referenced by the active persistence path

## Data Flow

**Recipe Authoring Flow:**

1. `src/app/search/company/page.tsx` and `src/app/search/people/page.tsx` load recipe lists via `listRecipesByType()` from `src/lib/db/repositories/recipes.ts`.
2. `src/features/recipes/components/recipe-list.tsx` opens inline editor mode on the search routes, and `src/features/recipes/components/recipe-editor.tsx` renders in the right pane.
3. `saveRecipeAction` parses form data through `parseRecipeFormData()` in `src/features/recipes/lib/recipe-form.ts`, validates with Zod schemas from `src/lib/recipes/schema.ts`, writes through repository functions, then `revalidatePath()` plus `redirect()` back to the relevant search workflow route.

**Company Search Flow:**

1. `src/app/search/company/page.tsx` loads the selected company recipe, existing company snapshots, and the currently active snapshot.
2. `src/features/company-search/components/company-search-panel.tsx` submits to `runCompanySearchAction` in `src/app/recipes/actions.ts`.
3. `runCompanySearchAction` reads the selected recipe, builds a signature with `createCompanySearchSignature()` from `src/lib/apollo/company-search.ts`, reuses an existing snapshot when allowed, otherwise calls `searchCompanies()` and persists via `saveCompanySnapshot()` in `src/lib/db/repositories/company-snapshots.ts`.
4. The company workflow re-renders with inline editor state, `CompanySearchWarning`, and direct links into saved company snapshot review routes.

**People Search Flow:**

1. `src/app/search/people/page.tsx` loads the selected people recipe, available company snapshot sources, and saved people snapshots for the active recipe.
2. `src/features/people-search/components/people-search-panel.tsx` manages company snapshot import state and submits the selected people recipe to `runPeopleSearchAction`.
3. `runPeopleSearchAction` validates the paired people recipe, normalizes payload using `peopleSearchPayloadSchema` and `peopleSearchRequestSchema` from `src/lib/people-search/schema.ts`, calls `searchPeople()` in `src/lib/apollo/people-search.ts`, then writes the result with `savePeopleSnapshot()` in `src/lib/db/repositories/people-snapshots.ts`.
4. The workflow redirects into `src/app/search/people/[peopleSnapshotId]/page.tsx`, which renders `src/features/people-search/components/people-results-table.tsx`.

**Run Planning Flow:**

1. `src/app/search/page.tsx` loads the latest run plan with `getLatestRunPlanForPeopleSnapshot()` from `src/lib/db/repositories/run-plans.ts`.
2. `src/features/run-planning/components/run-plan-panel.tsx` posts a max-contact cap to `saveRunPlanAction`.
3. `saveRunPlanAction` re-reads the people snapshot context, computes the estimate through `buildRunPlanEstimate()` in `src/features/run-planning/lib/run-plan-estimates.ts`, and persists a draft plan via `saveRunPlan()`.
4. `src/features/run-planning/components/retrieval-readiness-gate.tsx` can then post to `confirmRunPlanAction`, which flips the stored plan status to `"ready"` with `markRunPlanReady()`.

**State Management:**
- Server state is the source of truth and is loaded directly in server components from JSON-backed repositories.
- Client state is local and short-lived, used only for interactive search workspace concerns in `src/features/company-search/components/company-results-workspace.tsx` and `src/features/people-search/components/people-search-panel.tsx`.
- Navigation state is encoded in query parameters such as `companyRecipe`, `peopleRecipe`, `snapshot`, `peopleSnapshot`, `sourceSnapshot`, and `editorMode` across the search routes under `src/app/search/*`.

## Key Abstractions

**Recipe:**
- Purpose: Reusable saved filter set for either company or people search.
- Examples: `src/lib/recipes/schema.ts`, `src/lib/db/repositories/recipes.ts`
- Pattern: Discriminated union on `type` with normalization support for legacy payload shapes.

**Snapshot:**
- Purpose: Persisted search result tied to a recipe or recipe pairing so searches can be reused without rerunning Apollo calls.
- Examples: `src/lib/db/repositories/company-snapshots.ts`, `src/lib/db/repositories/people-snapshots.ts`
- Pattern: Append-or-update JSON record keyed by UUID plus search signature, with newest-first sorting by `updatedAt`.

**Run Plan:**
- Purpose: Explicit pre-retrieval estimate and readiness checkpoint for a people snapshot.
- Examples: `src/lib/db/repositories/run-plans.ts`, `src/features/run-planning/lib/run-plan-estimates.ts`
- Pattern: Single latest plan per `peopleSnapshotId`, rewritten in place and promoted from `"draft"` to `"ready"`.

**Apollo Search Service:**
- Purpose: Convert validated internal payloads into Apollo API requests or deterministic fixture responses.
- Examples: `src/lib/apollo/company-search.ts`, `src/lib/apollo/people-search.ts`
- Pattern: Parse input with Zod, compact payload, branch on `env.APOLLO_API_KEY`, normalize API JSON into internal preview rows, and attach a deterministic signature.

## Entry Points

**Root Redirect:**
- Location: `src/app/page.tsx`
- Triggers: Requests to `/`
- Responsibilities: Redirect immediately to `/search`

**Search Workspace Page:**
- Location: `src/app/search/page.tsx`
- Triggers: Requests to `/search`
- Responsibilities: Load paired recipes, usage telemetry, snapshots, and run-plan state; compose the operational workflow UI

**Workflow Pages:**
- Location: `src/app/search/company/page.tsx`, `src/app/search/people/page.tsx`
- Triggers: Requests to `/search/company` and `/search/people`
- Responsibilities: Load recipe lists, determine active recipe from query params, optionally render inline editing, and compose the workflow UI

**Recipe Redirects:**
- Location: `src/app/recipes/company/page.tsx`, `src/app/recipes/people/page.tsx`
- Triggers: Requests to `/recipes/company` and `/recipes/people`
- Responsibilities: Redirect legacy recipe routes into the search workflows

**Server Actions:**
- Location: `src/app/recipes/actions.ts`
- Triggers: Form submissions from feature components
- Responsibilities: Validate form data, mutate persisted JSON files, revalidate route caches, and redirect to the updated URL state

**API Routes:**
- Location: `src/app/api/company-search/route.ts`, `src/app/api/people-search/route.ts`, `src/app/api/apollo/usage/route.ts`
- Triggers: HTTP requests to `/api/company-search`, `/api/people-search`, and `/api/apollo/usage`
- Responsibilities: Provide JSON wrappers around company search, people search, and usage summary logic; these reuse the same `src/lib/*` services as server actions

## Error Handling

**Strategy:** Fail fast on invalid input with Zod parsing and explicit thrown errors; return graceful Apollo fallbacks only where the product intentionally supports a fixture mode or non-blocking usage visibility.

**Patterns:**
- Parse all external and form-derived input at the boundary using `companySearchRequestSchema`, `peopleSearchRequestSchema`, `recipeTypeSchema`, and recipe input schemas in `src/lib/company-search/schema.ts`, `src/lib/people-search/schema.ts`, and `src/lib/recipes/schema.ts`.
- Throw synchronous errors for missing IDs, wrong recipe types, missing snapshots, and non-OK Apollo search responses in `src/app/recipes/actions.ts`, `src/lib/apollo/company-search.ts`, `src/lib/apollo/people-search.ts`, and `src/lib/db/repositories/run-plans.ts`.
- Downgrade Apollo usage failures to descriptive UI text in `src/features/usage/lib/apollo-usage.ts` instead of blocking the workspace.
- Treat missing JSON data files as empty collections in repository readers such as `readRecipes()`, `readSnapshots()`, and `readRunPlans()`.

## Cross-Cutting Concerns

**Logging:** No dedicated logging layer is present. The active code path does not use structured application logs.
**Validation:** Boundary validation is Zod-first. Request payloads, recipe inputs, and environment variables are parsed in `src/lib/company-search/schema.ts`, `src/lib/people-search/schema.ts`, `src/lib/recipes/schema.ts`, and `src/lib/env.ts`.
**Authentication:** No app-level auth layer is implemented. Apollo API access is guarded only by server-side use of `env.APOLLO_API_KEY` inside `src/lib/apollo/company-search.ts`, `src/lib/apollo/people-search.ts`, and `src/features/usage/lib/apollo-usage.ts`.

---

*Architecture analysis: 2026-03-23*
