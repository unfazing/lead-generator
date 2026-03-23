---
phase: 01-recipe-and-usage-foundation
plan: 03
subsystem: api
tags: [apollo, telemetry, nextjs, route-handlers]
requires:
  - phase: 01
    provides: "Recipe workspace and server-only env configuration"
provides:
  - "Server-backed Apollo usage summary"
  - "Usage API route"
  - "Workspace-integrated usage panel with graceful missing-key state"
affects: [company-search, cost-controls]
tech-stack:
  added: []
  patterns: ["server-side third-party API access", "non-blocking operator telemetry states"]
key-files:
  created:
    [
      src/features/usage/lib/apollo-usage.ts,
      src/features/usage/components/usage-summary.tsx,
      src/app/api/apollo/usage/route.ts
    ]
  modified: [src/app/recipes/page.tsx, src/app/globals.css]
key-decisions:
  - "Apollo usage is fetched server-side only."
  - "Missing API configuration shows a helpful warning rather than blocking recipe editing."
patterns-established:
  - "Third-party telemetry is normalized into a UI-friendly summary before rendering."
  - "Operator-facing warnings are visible in the workspace, not buried in settings."
requirements-completed: [COST-01]
duration: 18min
completed: 2026-03-23
---

# Phase 01: Recipe and Usage Foundation Summary

**Apollo usage telemetry route and compact workspace summary with graceful fallback when the API key is absent**

## Performance

- **Duration:** 18 min
- **Started:** 2026-03-23T17:24:00+08:00
- **Completed:** 2026-03-23T17:42:00+08:00
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Added a server-only Apollo usage service and an app-facing route handler.
- Integrated a compact usage summary into the recipe workspace.
- Kept the experience usable even when Apollo credentials are not configured yet.

## Task Commits

Phase 1 was executed inline in a greenfield repo, so the work for this plan is captured in the phase execution commit rather than separate task commits.

## Files Created/Modified
- `src/features/usage/lib/apollo-usage.ts` - Apollo usage normalization and fallback behavior.
- `src/app/api/apollo/usage/route.ts` - Server-backed usage endpoint.
- `src/features/usage/components/usage-summary.tsx` - Workspace usage panel.
- `src/app/recipes/page.tsx` - Integrated usage visibility into the main operator surface.

## Decisions Made
- Returned normalized usage data instead of surfacing raw Apollo payloads in the UI.
- Treated missing API key configuration as a visible warning state instead of a fatal error.

## Deviations from Plan

None - plan executed as intended.

## Issues Encountered

- TypeScript inference around normalized usage stats needed a small correction during verification.
- ESLint flat-config needed `FlatCompat` to consume the Next.js config exports correctly.

## User Setup Required

- Add `APOLLO_API_KEY` to see live usage counters instead of the missing-key guidance state.

## Next Phase Readiness

The workspace now shows usage before search work begins, which sets Phase 2 up for explicit credit-aware company discovery.

---
*Phase: 01-recipe-and-usage-foundation*
*Completed: 2026-03-23*
