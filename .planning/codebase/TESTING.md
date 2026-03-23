# Testing Patterns

**Analysis Date:** 2026-03-23

## Test Framework

**Runner:**
- Not detected.
- Config: Not detected. No `vitest.config.*`, `jest.config.*`, or `playwright.config.*` files are present in `/Users/lian/dev/apollo`.

**Assertion Library:**
- Not detected.

**Run Commands:**
```bash
npm run lint           # Current automated quality gate
npm run typecheck      # Current static verification gate
npm test               # Not available; no test script is defined in `package.json`
```

## Test File Organization

**Location:**
- No `*.test.*` or `*.spec.*` files are present under `src/`, `app/`, or `tests/`.
- Current verification relies on static analysis and manual execution paths in application code.

**Naming:**
- Not applicable yet. When adding tests, follow the existing file naming style and use co-located kebab-case names such as `company-search-panel.test.tsx` next to `src/features/company-search/components/company-search-panel.tsx` or `recipe-form.test.ts` next to `src/features/recipes/lib/recipe-form.ts`.

**Structure:**
```text
Not established in the current codebase.
```

## Test Structure

**Suite Organization:**
```typescript
// No test suites exist yet.
// The closest reusable units to target first are:
// - `buildRunPlanEstimate` in `src/features/run-planning/lib/run-plan-estimates.ts`
// - `parseRecipeFormData` in `src/features/recipes/lib/recipe-form.ts`
// - `createCompanySearchSignature` and warning logic in `src/lib/apollo/company-search.ts`
```

**Patterns:**
- Setup pattern: Not established.
- Teardown pattern: Not established.
- Assertion pattern: Not established.

## Mocking

**Framework:** Not detected

**Patterns:**
```typescript
// No mocking framework is present yet.
// Future tests will need to isolate:
// - `fetch` calls in `src/lib/apollo/company-search.ts`
// - `fetch` calls in `src/features/usage/lib/apollo-usage.ts`
// - filesystem access in `src/lib/db/repositories/recipes.ts`
```

**What to Mock:**
- Mock Apollo network boundaries in `src/lib/apollo/company-search.ts` and `src/lib/apollo/people-search.ts` so tests do not spend credits or depend on external availability.
- Mock environment state from `src/lib/env.ts` when exercising configured vs fallback behavior in `src/features/usage/lib/apollo-usage.ts`.
- Mock filesystem persistence in `src/lib/db/repositories/recipes.ts`, `src/lib/db/repositories/company-snapshots.ts`, `src/lib/db/repositories/people-snapshots.ts`, and `src/lib/db/repositories/run-plans.ts` unless the test is explicitly covering the file-backed adapter.

**What NOT to Mock:**
- Do not mock Zod schemas in `src/lib/company-search/schema.ts`, `src/lib/people-search/schema.ts`, or `src/lib/recipes/schema.ts`; schema validation is core behavior.
- Do not mock pure transformation helpers such as `buildRunPlanEstimate` in `src/features/run-planning/lib/run-plan-estimates.ts` or parsing helpers in `src/features/recipes/lib/recipe-form.ts`.

## Fixtures and Factories

**Test Data:**
```typescript
// Reuse the existing fixture-oriented shapes already embedded in production code:
// - `getFixtureResult(...)` in `src/lib/apollo/company-search.ts`
// - fixture fallback paths when `env.APOLLO_API_KEY` is absent in `src/features/usage/lib/apollo-usage.ts`
//
// Recommended factory targets for future tests:
// - valid company recipe payloads matching `companyRecipeInputSchema` in `src/lib/recipes/schema.ts`
// - valid people recipe payloads matching `peopleRecipeInputSchema` in `src/lib/recipes/schema.ts`
// - snapshot records matching repository return shapes from `src/lib/db/repositories/company-snapshots.ts`
```

**Location:**
- Not established. The most consistent future pattern is co-located fixtures near the modules they support, for example alongside `src/features/recipes/lib/recipe-form.ts` and `src/lib/apollo/company-search.ts`.

## Coverage

**Requirements:** None enforced

**View Coverage:**
```bash
Not available; no coverage tooling is configured.
```

## Test Types

**Unit Tests:**
- Not present.
- First candidates are pure logic modules and schema-driven parsers: `src/features/run-planning/lib/run-plan-estimates.ts`, `src/features/recipes/lib/recipe-form.ts`, `src/lib/company-search/schema.ts`, `src/lib/people-search/schema.ts`, and `src/lib/recipes/schema.ts`.

**Integration Tests:**
- Not present.
- Highest-value future integration coverage is at the server boundary: `src/app/api/company-search/route.ts`, `src/app/api/people-search/route.ts`, `src/app/api/apollo/usage/route.ts`, and the server actions in `src/app/recipes/actions.ts`.

**E2E Tests:**
- Not used.
- If added later, the primary user journey is inline recipe creation/editing inside `src/app/search/company/page.tsx` and `src/app/search/people/page.tsx`, company search in `src/features/company-search/components/company-search-panel.tsx`, people search from `src/app/recipes/actions.ts`, and reviewed snapshot pages under `src/app/search/people/[peopleSnapshotId]/page.tsx`.

## Current Verification Baseline

- `package.json` defines `npm run lint` and `npm run typecheck` as the only automated checks.
- Several modules already contain credit-safe fallback behavior that should be preserved in tests, especially `getFixtureResult` in `src/lib/apollo/company-search.ts` and the missing-key branch in `src/features/usage/lib/apollo-usage.ts`.
- UI and orchestration flows currently depend on manual verification through the Next.js app pages in `src/app/page.tsx`, `src/app/search/page.tsx`, `src/app/search/company/page.tsx`, `src/app/search/people/page.tsx`, and `src/app/search/people/[peopleSnapshotId]/page.tsx`.

## Common Patterns

**Async Testing:**
```typescript
// No async test pattern exists yet.
// The main async seams are:
// - route handlers in `src/app/api/*/route.ts`
// - server actions in `src/app/recipes/actions.ts`
// - repository modules under `src/lib/db/repositories/*.ts`
// - Apollo usage/search functions using `fetch`
```

**Error Testing:**
```typescript
// No error assertion pattern exists yet.
// Priority error paths to codify:
// - missing form IDs and recipe mismatches in `src/app/recipes/actions.ts`
// - invalid request bodies rejected by Zod in `src/app/api/company-search/route.ts`
// - Apollo non-OK responses in `src/lib/apollo/company-search.ts`
// - ENOENT fallback behavior in `src/lib/db/repositories/recipes.ts`
```

## Practical Guidance For Future Phases

- Add a test runner before planning feature-heavy phases that touch `src/app/recipes/actions.ts` or the Apollo adapters in `src/lib/apollo/`.
- Start with unit tests for pure modules, then add integration coverage around route handlers and server actions where schema validation, persistence, and redirect behavior meet.
- Keep Apollo-dependent tests credit-safe by forcing the fixture path or mocking `fetch`; never rely on live `APOLLO_API_KEY` during routine verification.

---

*Testing analysis: 2026-03-23*
