# Codebase Concerns

**Analysis Date:** 2026-03-23

## Tech Debt

**File-backed persistence is the operational database:**
- Issue: Recipes, company snapshots, people snapshots, and run plans are all persisted through JSON files with read-modify-write cycles rather than an actual transactional store.
- Files: `src/lib/db/repositories/recipes.ts`, `src/lib/db/repositories/company-snapshots.ts`, `src/lib/db/repositories/people-snapshots.ts`, `src/lib/db/repositories/run-plans.ts`
- Impact: Concurrent writes can clobber each other, partial writes can corrupt the only source of truth, and dataset size growth increases latency because each mutation rewrites the entire file.
- Fix approach: Replace the repository layer with a real database-backed implementation, or add file locking, atomic temp-file writes plus rename, and schema validation on every read as a minimum stopgap.

**Configured recipe path and snapshot path can diverge:**
- Issue: `ensureDataDirectory()` only creates the directory for `getRecipeDataFilePath()`, but snapshots and run plans always write to `process.cwd()/data/*.json`.
- Files: `src/lib/db/client.ts`, `src/lib/db/repositories/company-snapshots.ts`, `src/lib/db/repositories/people-snapshots.ts`, `src/lib/db/repositories/run-plans.ts`
- Impact: If `RECIPE_DATA_FILE` points outside `data/`, recipe writes succeed while snapshot and run-plan writes can fail because `data/` was never created.
- Fix approach: Create directories for each target file path before writing, or centralize all file-path resolution in one storage module that returns both path and ensured directory.

**Database migration is half-started and inactive:**
- Issue: Drizzle schema files exist, but runtime storage still uses JSON files and the `drizzle-orm` dependency is not wired into repositories.
- Files: `src/lib/db/schema/recipes.ts`, `src/lib/db/schema/company-snapshots.ts`, `src/lib/db/repositories/*.ts`, `package.json`
- Impact: Future work has two competing persistence models, which raises the risk of duplicating logic or making incorrect assumptions about where production data lives.
- Fix approach: Either complete the database migration and retire file-backed repositories, or remove inactive DB scaffolding until the migration is scheduled.

## Known Bugs

**People search accepts forged or stale company selection context:**
- Symptoms: The server action and API route accept arbitrary `selectedCompanyIds` and `companySnapshotId` values without verifying that the selected IDs belong to the snapshot being used.
- Files: `src/app/recipes/actions.ts`, `src/app/api/people-search/route.ts`, `src/lib/people-search/schema.ts`
- Trigger: Submit a crafted form or direct API request with `mode="selected"` and company IDs that were never present in the current snapshot.
- Workaround: None in code. The UI limits normal interaction, but server-side validation is missing.

**Selected-company mode can be bypassed outside the UI:**
- Symptoms: The button is disabled in the browser when no companies are selected, but `runPeopleSearchAction()` still accepts `mode="selected"` with an empty `selectedCompanyIds` array.
- Files: `src/features/people-search/components/people-search-panel.tsx`, `src/app/recipes/actions.ts`, `src/app/api/people-search/route.ts`
- Trigger: Submit the action or API route directly with `mode="selected"` and no IDs.
- Workaround: None in code. Relying on the disabled button is not sufficient for a credit-bearing server operation.

## Security Considerations

**Credit-bearing endpoints are unauthenticated:**
- Risk: Any caller who can reach the app can hit company search, people search, and usage endpoints, which can expose internal workspace data and consume Apollo credits.
- Files: `src/app/api/company-search/route.ts`, `src/app/api/people-search/route.ts`, `src/app/api/apollo/usage/route.ts`, `src/app/recipes/actions.ts`
- Current mitigation: Request payloads are schema-validated with Zod, and Apollo credentials remain server-side.
- Recommendations: Add at least one server-side access guard for the single-user workflow, reject anonymous requests, and consider route-level CSRF/rate-limiting for all Apollo-touching operations.

**Snapshot and run-plan data are returned wholesale over API responses:**
- Risk: API routes return stored snapshot objects directly, including full request payloads and result sets.
- Files: `src/app/api/company-search/route.ts`, `src/app/api/people-search/route.ts`
- Current mitigation: None beyond schema validation.
- Recommendations: Require auth before returning data, and narrow response payloads to only fields the client actually needs.

**Raw JSON files are trusted without schema validation:**
- Risk: Snapshot and run-plan repositories cast parsed JSON directly to TypeScript types instead of validating runtime shape.
- Files: `src/lib/db/repositories/company-snapshots.ts`, `src/lib/db/repositories/people-snapshots.ts`, `src/lib/db/repositories/run-plans.ts`
- Current mitigation: None.
- Recommendations: Add Zod schemas for every persisted record and fail fast with actionable errors when the on-disk payload is malformed.

## Performance Bottlenecks

**Every mutation rewrites whole JSON collections:**
- Problem: Create/update operations read the full collection into memory and rewrite the full file on every save.
- Files: `src/lib/db/repositories/recipes.ts`, `src/lib/db/repositories/company-snapshots.ts`, `src/lib/db/repositories/people-snapshots.ts`, `src/lib/db/repositories/run-plans.ts`
- Cause: The persistence model is append-or-rewrite JSON files rather than indexed storage.
- Improvement path: Move to a database or introduce append-only logs plus periodic compaction if file storage must remain temporarily.

**Snapshot payloads embed entire Apollo result sets:**
- Problem: Company and people snapshots store full request metadata plus full result rows inline, then pages read and sort whole collections.
- Files: `src/lib/db/repositories/company-snapshots.ts`, `src/lib/db/repositories/people-snapshots.ts`, `src/app/search/page.tsx`
- Cause: Snapshot storage has no normalization, paging, or archival strategy.
- Improvement path: Persist only the fields needed for reuse/review, archive old snapshots, and move paging/filtering into storage instead of loading everything into memory.

## Fragile Areas

**Server actions centralize too many workflow transitions:**
- Files: `src/app/recipes/actions.ts`
- Why fragile: Recipe CRUD, company search, people search, run-plan creation, and run-plan confirmation all live in one server-actions file, so small workflow changes can create regressions in unrelated steps.
- Safe modification: Split actions by domain (`recipes`, `company-search`, `people-search`, `run-plans`) and add targeted tests before changing redirect or persistence behavior.
- Test coverage: No automated tests detected for this file.

**Apollo response mapping is tightly coupled to undocumented fallback shapes:**
- Files: `src/lib/apollo/company-search.ts`, `src/lib/apollo/people-search.ts`
- Why fragile: The code maps multiple possible Apollo field names by hand and assumes array/object shapes from `response.json()` without runtime validation of the external payload.
- Safe modification: Isolate Apollo DTO parsing into schema-backed adapters and add fixture-based tests for real and edge-case response payloads.
- Test coverage: No automated tests detected for the adapters or normalization paths.

**Client-side selection state is ephemeral and easy to invalidate:**
- Files: `src/features/company-search/components/company-results-workspace.tsx`, `src/features/people-search/components/people-search-panel.tsx`
- Why fragile: Selected companies are held only in client component state and are reset whenever the company snapshot changes, with no server-side reconciliation against the submitted snapshot.
- Safe modification: Persist selection intent against snapshot IDs or revalidate selected IDs server-side before executing people search.
- Test coverage: No automated tests detected for this interaction.

## Scaling Limits

**Current storage model is sized for one operator and small datasets:**
- Current capacity: Practical only for a single user with modest numbers of recipes and snapshots because every list/read operation loads whole JSON collections.
- Limit: The model degrades as snapshot history grows and becomes unsafe under concurrent requests or multiple browser tabs saving at once.
- Scaling path: Use a transactional database with indexed lookup by recipe ID, signature, and snapshot context.

**Search workflows are limited by full-response handling:**
- Current capacity: Request schemas cap page size at 100 and page number at 500, but stored snapshots still keep each page's full row payload.
- Limit: Large snapshot histories increase disk churn and render latency even before Apollo API limits are reached.
- Scaling path: Store compact snapshot metadata plus paged result fragments, or expire superseded snapshots aggressively.

## Dependencies at Risk

**`drizzle-orm`:**
- Risk: The package and schema files imply a database-backed architecture that the live code does not use.
- Impact: Future contributors can waste time extending unused schemas or assuming migrations exist when runtime persistence is still file-based.
- Migration plan: Either wire Drizzle into the repository layer fully or remove the unused dependency and schema scaffolding until the migration is funded.

## Missing Critical Features

**No server-side single-user access control:**
- Problem: The product is scoped as a single-user internal tool, but the code does not enforce that assumption anywhere.
- Blocks: Safe deployment beyond a trusted local environment.

**No retrieval-phase implementation or verified-email execution safety rails:**
- Problem: Run planning exists, but the current code only estimates readiness and explicitly defers actual retrieval validation to a later phase.
- Blocks: End-to-end verified-email CSV delivery from the current codebase.

## Test Coverage Gaps

**Repository and persistence behavior are untested:**
- What's not tested: Concurrent writes, malformed JSON recovery, snapshot reuse logic, and run-plan updates.
- Files: `src/lib/db/repositories/recipes.ts`, `src/lib/db/repositories/company-snapshots.ts`, `src/lib/db/repositories/people-snapshots.ts`, `src/lib/db/repositories/run-plans.ts`
- Risk: Data loss or corruption can ship unnoticed because the most stateful code has no automated verification.
- Priority: High

**Apollo integration and normalization paths are untested:**
- What's not tested: Request payload shaping, fallback fixture behavior, pagination handling, and field normalization from Apollo responses.
- Files: `src/lib/apollo/company-search.ts`, `src/lib/apollo/people-search.ts`, `src/features/usage/lib/apollo-usage.ts`
- Risk: External API shape changes can silently break search workflows or usage telemetry.
- Priority: High

**Apollo auth and usage-payload assumptions changed during live verification:**
- Issue: Apollo's tutorial/reference mix is inconsistent about auth style, and the previous implementation in `src/features/usage/lib/apollo-usage.ts` assumed bearer auth plus top-level `daily_requests` counters.
- Files: `src/features/usage/lib/apollo-usage.ts`
- Impact: The workspace would silently show degraded usage visibility even though the live endpoint was healthy, because this account accepts `X-Api-Key` and returns endpoint-keyed rate-limit objects instead.
- Fix approach: Keep Apollo integrations aligned to live contract checks, prefer fixture-backed or recorded response tests for endpoint parsers, and re-verify auth/header expectations before broadening endpoint coverage.

**Workflow guards are untested:**
- What's not tested: Invalid recipe pairings, forged snapshot context, selected-company mode invariants, and run-plan confirmation flows.
- Files: `src/app/recipes/actions.ts`, `src/app/api/company-search/route.ts`, `src/app/api/people-search/route.ts`, `src/features/run-planning/lib/run-plan-estimates.ts`
- Risk: Credit-consuming paths can accept invalid state transitions without detection.
- Priority: High

---

*Concerns audit: 2026-03-23*
