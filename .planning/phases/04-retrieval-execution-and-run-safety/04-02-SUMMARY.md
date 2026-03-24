---
phase: 04-retrieval-execution-and-run-safety
plan: 02
subsystem: retrieval
tags: [apollo, retrieval, polling, resume, nextjs, vitest]
requires:
  - phase: 04-01
    provides: durable retrieval run and item persistence
provides:
  - interrupted-run inspection derived from persisted heartbeat and item state
  - explicit resume path that requeues unresolved contacts only
  - server-backed retrieval summary polling with estimate-versus-actual reconciliation
affects: [retrieval, people-workflow, run-monitoring]
tech-stack:
  added: []
  patterns: [persisted retrieval summary read model, route-polled run monitoring]
key-files:
  created:
    - src/app/api/retrieval-runs/[runId]/route.ts
    - src/features/retrieval-runs/components/retrieval-run-usage-summary.tsx
    - tests/retrieval-usage-summary.test.tsx
  modified:
    - src/lib/retrieval/execution.ts
    - src/lib/retrieval/run-summary.ts
    - src/features/retrieval-runs/components/retrieval-run-status-card.tsx
    - src/app/recipes/actions.ts
    - src/app/search/people/page.tsx
key-decisions:
  - "Visible interrupted state is derived from stale persisted heartbeat and lease data, not client timers."
  - "Resume requeues only persisted failed or in-flight items; completed contacts are never replayed."
  - "Estimate-versus-actual UI reads a server summary model so immutable plan estimates stay auditable."
patterns-established:
  - "Retrieval status cards consume a server summary object and poll the route handler for fresh persisted state."
  - "Usage reconciliation combines run-plan estimate fields with run and item counters instead of recomputing from client selections."
requirements-completed: [COST-04, EMAI-03]
duration: 16min
completed: 2026-03-24
---

# Phase 04 Plan 02: Retrieval Resume and Usage Summary

**Persisted interruption detection, resume-only unresolved contacts, and estimate-versus-actual polling summaries for retrieval runs**

## Performance

- **Duration:** 16 min
- **Started:** 2026-03-24T13:36:00Z
- **Completed:** 2026-03-24T13:52:00Z
- **Tasks:** 2
- **Files modified:** 13

## Accomplishments

- Retrieval runs now surface an `interrupted` visible state from stale persisted heartbeat and lease data.
- Resume execution requeues only unresolved `processing` or `failed` items and leaves completed contacts untouched.
- The people workflow now renders a server-backed estimate-versus-actual usage summary and polls `/api/retrieval-runs/[runId]` for updated status.

## Task Commits

1. **Task 1: Implement interruption detection, safe inspection, and resume targeting** - `8ecd642` (feat)
2. **Task 2: Add actual-versus-estimated usage reconciliation and polling summary API** - `b41f360` (feat)

## Files Created/Modified

- `src/lib/retrieval/run-summary.ts` - Builds persisted resume and usage rollups from run and item storage.
- `src/lib/retrieval/execution.ts` - Requeues interrupted work safely before resuming execution.
- `src/app/recipes/actions.ts` - Adds explicit resume action for persisted retrieval runs.
- `src/app/api/retrieval-runs/[runId]/route.ts` - Returns polling-friendly retrieval summaries from server state.
- `src/features/retrieval-runs/components/retrieval-run-status-card.tsx` - Polls server summary state and exposes resume affordance.
- `src/features/retrieval-runs/components/retrieval-run-usage-summary.tsx` - Renders immutable estimate versus actual usage counts.
- `src/app/search/people/page.tsx` - Hydrates initial retrieval summaries for the people workflow.
- `tests/retrieval-resume.test.ts` - Covers stale-heartbeat interruption and unresolved-only resume behavior.
- `tests/retrieval-usage-summary.test.ts` - Covers persisted rollup math.
- `tests/retrieval-usage-summary.test.tsx` - Covers route output and rendered reconciliation UI.

## Decisions Made

- Derived interruption status from persisted heartbeat and lease expiry instead of mutating stored run status on read.
- Counted actual attempted contacts as `apolloRequestedItems + reusedItems` so cached reuse is visible alongside Apollo-spend activity.
- Kept polling logic in the status card and left the usage summary component presentational so server rendering remains testable.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Re-ran type generation before final typecheck**
- **Found during:** Task 2
- **Issue:** `tsc --noEmit` initially failed because `.next/types` entries referenced by `tsconfig.json` were missing in the active workspace.
- **Fix:** Re-ran verification after the Next-generated type files were present so the planned typecheck could complete successfully.
- **Files modified:** None
- **Verification:** `npm run typecheck`
- **Committed in:** n/a

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** No scope change. The fix restored the planned verification path.

## Issues Encountered

- A pre-existing in-progress usage-summary component variant conflicted with the new summary prop shape; it was normalized into a presentational component so the card owns polling and SSR tests remain stable.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Interrupted and completed retrieval runs now expose trustworthy persisted status and cost reconciliation for UAT.
- The next retrieval phase can build on the summary route for richer monitoring without changing the immutable run-plan estimate fields.

## Self-Check: PASSED

- Verified summary file exists on disk.
- Verified task commits `8ecd642` and `b41f360` exist in git history.
