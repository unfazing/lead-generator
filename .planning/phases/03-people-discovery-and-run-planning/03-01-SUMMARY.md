---
phase: 03-people-discovery-and-run-planning
plan: 01
status: completed
completed_at: "2026-03-23T11:20:00.000Z"
requirements:
  - PEOP-01
  - PEOP-02
  - PEOP-03
  - PEOP-04
---

# Plan 03-01 Summary

Implemented the people-preview flow from company snapshot context. Operators can now choose either selected companies or the full company snapshot, run a people preview using the saved people recipe, and persist that preview as a reusable people snapshot.

The new people search path stays server-owned, validates an Apollo-aligned request shape, and falls back to fixtures when `APOLLO_API_KEY` is absent. That keeps routine verification safe while preserving the real Apollo execution path for narrow live runs.

## Delivered

- `src/lib/people-search/schema.ts` defines the shared people search payload, request, and selection-mode contract.
- `src/lib/apollo/people-search.ts` executes server-side people preview search and normalizes preview rows.
- `src/lib/db/schema/people-snapshots.ts` and `src/lib/db/repositories/people-snapshots.ts` persist people snapshots tied to the source company snapshot and selection mode.
- `src/features/people-search/components/people-search-panel.tsx` adds explicit selected-company versus all-company run controls on `/search`.
- `src/features/people-search/components/people-results-table.tsx` renders persisted people preview data instead of transient raw responses.

## Notes

- People preview remains separate from verified-email retrieval. This phase only establishes preview search, snapshot reuse, and source-context persistence.
