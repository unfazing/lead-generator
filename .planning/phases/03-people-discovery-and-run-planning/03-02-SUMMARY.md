---
phase: 03-people-discovery-and-run-planning
plan: 02
status: completed
completed_at: "2026-03-23T11:25:00.000Z"
requirements:
  - COST-02
  - COST-03
---

# Plan 03-02 Summary

Added an explicit run-planning step after people preview. The search workspace now computes a conservative pre-retrieval estimate from the reviewed people snapshot and persists stop conditions with the plan instead of leaving them as ephemeral form state.

The planner is intentionally snapshot-bound: estimates and caps are saved against the active people snapshot and recipe pairing so later retrieval work can begin from a known reviewed context.

## Delivered

- `src/features/run-planning/lib/run-plan-estimates.ts` derives a conservative contact estimate from the reviewed people snapshot and user cap.
- `src/lib/db/schema/run-plans.ts` and `src/lib/db/repositories/run-plans.ts` persist run plans with estimate details, max-contact cap, and status.
- `src/features/run-planning/components/run-plan-panel.tsx` adds the planning panel to `/search` with visible estimate and stop-condition inputs.
- `src/app/search/page.tsx` loads the latest run plan for the active people snapshot and presents it inline with the search workflow.

## Notes

- Estimate language stays deliberately conservative and does not imply exact Apollo billing.
