---
phase: 02-company-search-and-snapshot-preview
verified: "2026-03-23T10:36:00.000Z"
status: passed
score: 4/4 must-haves verified
---

# Phase 02: company-search-and-snapshot-preview — Verification

## Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | User can submit Apollo-aligned company-search filters from the recipe workspace only when they explicitly click a search action. | verified | `src/features/company-search/components/company-search-panel.tsx`, `src/app/recipes/actions.ts`, `src/lib/apollo/company-filter-definitions.ts` |
| 2 | User can review paginated company previews with default columns and optionally reveal more Apollo-returned fields without re-running search. | verified | `src/features/company-search/components/company-results-table.tsx`, `src/features/company-search/components/company-column-picker.tsx`, `src/app/recipes/page.tsx` |
| 3 | Matching company snapshots are reused by default, and the user has a separate explicit action to fetch the latest snapshot. | verified | `src/app/recipes/actions.ts`, `src/lib/db/repositories/company-snapshots.ts`, `src/app/recipes/page.tsx` |
| 4 | Broad-search warnings are visible but non-blocking, and routine verification can avoid live credit-bearing calls through fixture-backed search behavior. | verified | `src/features/company-search/components/company-search-warning.tsx`, `src/features/company-search/lib/company-search-warnings.ts`, `src/lib/apollo/company-search.ts` |

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/company-search/schema.ts` | Shared Apollo-aligned company-search payload validation | verified | Present and used by server actions and backend search execution |
| `src/lib/db/repositories/company-snapshots.ts` | Durable snapshot lookup/create behavior keyed by request signature | verified | Present and used for default reuse and latest refresh |
| `src/features/company-search/components/company-search-panel.tsx` | Workspace-integrated company search controls | verified | Present and renders explicit search actions |
| `src/features/company-search/components/company-results-table.tsx` | Paginated preview table for normalized company results | verified | Present and renders default plus optional columns |

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| `src/lib/apollo/company-filter-definitions.ts` | `src/features/company-search/components/company-search-panel.tsx` | Shared filter metadata drives UI control choices | verified | Frontend control types align with the supported request contract |
| `src/app/recipes/actions.ts` | `src/lib/db/repositories/company-snapshots.ts` | Search execution and snapshot reuse/latest flow | verified | Matching snapshots are reused first unless the user explicitly requests latest |
| `src/lib/apollo/company-search.ts` | `src/features/company-search/components/company-results-table.tsx` | Normalized preview rows and optional column availability | verified | Preview table renders normalized data rather than raw Apollo payloads |

## Requirements Coverage

| Requirement | Status | Blocking Issue |
|-------------|--------|----------------|
| COMP-01 | verified | |
| COMP-02 | verified | |
| COMP-03 | verified | |
| COMP-04 | verified | |

## Result

Verification passed via `npm run build`, `npm run typecheck`, and `npm run lint`, plus source inspection against the phase must-haves. `npm run typecheck` must run after `npm run build` in this repository because `tsconfig.json` includes `.next/types/**/*.ts`, and those generated files are recreated during the build.
