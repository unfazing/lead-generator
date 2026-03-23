---
phase: 02-company-search-and-snapshot-preview
plan: 01
status: completed
completed_at: "2026-03-23T10:35:00.000Z"
requirements:
  - COMP-01
  - COMP-03
---

# Plan 02-01 Summary

Implemented the Phase 2 backend contract for company search. Company filters now use an Apollo-aligned normalized payload, backed by shared filter metadata, Zod validation, and server-only search execution.

Added durable company snapshot storage so searches can be reused by request signature instead of re-running Apollo calls by default. The search service supports fixture fallback when `APOLLO_API_KEY` is unavailable, which keeps routine verification credit-safe while preserving the live execution path.

## Delivered

- `src/lib/apollo/company-filter-definitions.ts` defines the supported Phase 2 company filters and their UI/control metadata.
- `src/lib/company-search/schema.ts` validates the normalized search payload and explicit reuse/latest modes.
- `src/lib/apollo/company-search.ts` normalizes Apollo company responses into preview-friendly rows and warning metadata.
- `src/lib/db/schema/company-snapshots.ts` and `src/lib/db/repositories/company-snapshots.ts` persist reusable company snapshots.
- `src/app/api/company-search/route.ts` exposes server-owned search execution and snapshot reuse/latest behavior.

## Notes

- Live company search remains credit-bearing, so fixture-first verification is the default unless a narrow live smoke test is intentionally performed.
