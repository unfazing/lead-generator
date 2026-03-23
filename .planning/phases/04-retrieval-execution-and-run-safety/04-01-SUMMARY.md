---
phase: 04-retrieval-execution-and-run-safety
plan: 01
subsystem: retrieval
tags: [apollo, vitest, nextjs, zod, file-storage, retrieval]
requires:
  - phase: 03.1-rework-the-search-flow
    provides: search-first workflow context, reviewed people snapshots, and explicit run-plan confirmation
provides:
  - durable retrieval-run and retrieval-run-item repositories
  - bulk-first Apollo enrichment executor with persisted throttling and retry state
  - explicit retrieval kickoff from confirmed plans
  - server-backed retrieval status card on /search
affects: [phase-04-plan-02, phase-04-plan-03, phase-05-export]
tech-stack:
  added: [vitest]
  patterns: [atomic json persistence, lease-aware file-backed execution, server-owned retrieval kickoff]
key-files:
  created:
    - src/lib/apollo/people-enrichment.ts
    - src/lib/retrieval/execution.ts
    - src/lib/db/repositories/retrieval-runs.ts
    - src/lib/db/repositories/retrieval-run-items.ts
    - src/features/retrieval-runs/components/retrieval-run-status-card.tsx
  modified:
    - package.json
    - src/app/recipes/actions.ts
    - src/app/search/page.tsx
    - src/features/run-planning/components/retrieval-readiness-gate.tsx
    - vitest.config.ts
key-decisions:
  - "Retrieval execution state lives in dedicated run and item repositories instead of extending run-plans.json beyond foreign-key linkage."
  - "Kickoff persists the retrieval run immediately and then lets the server executor advance batches asynchronously."
  - "File-backed retrieval tests run serially to keep shared JSON fixture verification deterministic."
patterns-established:
  - "Atomic JSON repositories: read through Zod, write through temp-file rename helpers."
  - "Retrieval executor batches pending items, persists checkpoints at each batch boundary, and records cooldown/retry metadata on the run header."
requirements-completed: [EMAI-02]
duration: 20min
completed: 2026-03-23
---

# Phase 4 Plan 1: Retrieval Execution Summary

**Durable retrieval runs with bulk-first Apollo enrichment, single-run lease safety, and persisted `/search` progress visibility**

## Performance

- **Duration:** 20 min
- **Started:** 2026-03-23T19:27:00Z
- **Completed:** 2026-03-23T19:47:57Z
- **Tasks:** 4
- **Files modified:** 15

## Accomplishments
- Added a real Vitest harness plus named retrieval-domain test files so Phase 4 can verify runtime behavior instead of relying on lint/typecheck alone.
- Introduced durable retrieval-run and retrieval-run-item storage with atomic writes, schema-validated reads, and persisted lease metadata for single-run execution safety.
- Implemented a bulk-first Apollo enrichment executor with persisted checkpoints, retry backoff, cooldown state, and explicit kickoff from confirmed plans.
- Surfaced the latest server-backed retrieval run on `/search` with persisted counts, checkpoints, and cooldown visibility.

## Task Commits

Each task was committed atomically:

1. **Task 1: Establish Wave 0 test infrastructure for retrieval-run durability and executor behavior** - `c952546` (test)
2. **Task 2: Create durable retrieval-run storage with active-run lease safety** - `bb43be6` (feat)
3. **Task 3: Implement Apollo bulk-first kickoff, throttling, and persisted progress updates** - `80ae619` (feat)
4. **Task 4: Surface active retrieval-run status in the search-first workspace** - `03197f7` (feat)

**Additional fix:** `16177a8` (fix) - serialize file-backed retrieval tests for deterministic verification

## Files Created/Modified
- `package.json` - adds the real `npm run test` entry for retrieval verification.
- `vitest.config.ts` - resolves the repo alias and disables cross-file parallelism for shared JSON fixture tests.
- `src/lib/db/repositories/file-storage.ts` - shared atomic JSON read/write helpers with fallback handling.
- `src/lib/db/repositories/retrieval-runs.ts` - durable run headers, counters, heartbeat fields, and lease enforcement.
- `src/lib/db/repositories/retrieval-run-items.ts` - per-contact retrieval item persistence and batch-state updates.
- `src/lib/apollo/people-enrichment.ts` - Apollo `bulk_match` / `match` request shaping plus normalized enrichment outcomes.
- `src/lib/retrieval/execution.ts` - kickoff flow and lease-aware executor loop with checkpoint persistence.
- `src/app/recipes/actions.ts` - explicit server action for retrieval kickoff from a confirmed run plan.
- `src/features/run-planning/components/retrieval-readiness-gate.tsx` - readiness UI now starts retrieval runs after confirmation.
- `src/features/retrieval-runs/components/retrieval-run-status-card.tsx` - compact persisted run status surface for `/search`.
- `src/app/search/page.tsx` - loads and renders the latest retrieval-run state for the active people snapshot.

## Decisions Made

- Dedicated retrieval-run repositories were added instead of overloading `run-plans.json`, because execution counters, lease state, and per-contact outcomes need a separate durable lifecycle.
- Kickoff remains an explicit operator action from a confirmed plan, but it returns after persistence and leaves batch execution to a server-owned async loop.
- Rate-limit and retry state is stored on the run header so reloads show whether the executor is active, cooling down, or retrying.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added Vitest alias resolution and serial file-backed execution**
- **Found during:** Tasks 2-4 verification
- **Issue:** Retrieval tests could not resolve the repo `@/` alias at first, and the final full-suite run exposed cross-file races against shared JSON fixtures.
- **Fix:** Added `vitest.config.ts` alias mapping and disabled file-parallel execution for the retrieval suite.
- **Files modified:** `vitest.config.ts`
- **Verification:** `npm run test -- retrieval-runs.repository people-enrichment.execution retrieval-resume retrieval-preflight retrieval-quality retrieval-run-status-card`
- **Committed in:** `16177a8`

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** The fix was required for reliable verification only. No product scope changed.

## Issues Encountered

- Shared file-backed fixture tests were initially racing when the full retrieval suite ran together. Serializing file execution resolved the issue cleanly.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 4 now has durable execution records, explicit kickoff, and persisted status visibility ready for resume, reconciliation, and dedupe work.
- Remaining Phase 4 plans can build on stored run headers/items instead of extending transient run-plan state.

## Self-Check: PASSED

---
*Phase: 04-retrieval-execution-and-run-safety*
*Completed: 2026-03-23*
