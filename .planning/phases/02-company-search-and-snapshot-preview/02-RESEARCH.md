# Phase 02 Research: Company Search and Snapshot Preview

**Date:** 2026-03-23
**Phase:** 02 - company-search-and-snapshot-preview
**Confidence:** HIGH

## Question

What does Phase 2 need in order to implement Apollo company search, paginated preview, and snapshot reuse safely and in a way that matches Apollo’s official request contract?

## Key Findings

### 1. Company search must stay explicit and server-owned

- Apollo organization search is a credit-bearing endpoint, so search must remain an explicit user action rather than any keystroke-triggered or auto-refresh flow.
- The current project direction is correct: run company search only from the backend, normalize the request server-side, and persist the result as a local snapshot before any downstream step.
- Snapshot reuse should be a first-class behavior because it reduces repeat credit spend and supports deterministic reruns.

### 2. Form controls must reflect Apollo’s real request shape

- Search UI should not expose arbitrary text inputs for fields Apollo treats as constrained values.
- The planner should require a filter-definition layer that maps each supported Apollo company search parameter to:
  - input type
  - allowed values, if constrained
  - serialization rules
  - empty/default handling
- This mapping should drive both frontend form rendering and backend request validation so the UI cannot drift from the API contract.

### 3. Snapshot persistence needs its own repository/read model

- Recipes are already durable and validated in Phase 1.
- Phase 2 should add a sibling snapshot persistence layer rather than mixing search results into the recipe record itself.
- Snapshot data should capture:
  - recipe or filter signature
  - normalized request payload
  - fetched-at timestamp
  - result items
  - column metadata or available field keys
  - warning metadata for broad/cap-adjacent searches

### 4. Broad-search handling should warn, not block

- The user explicitly chose warning-based continuation.
- That means the plan must include a visible warning state and still allow the operator to continue reviewing results.
- The warning should highlight likely credit waste and potential 50,000-result truncation risk without forcing immediate refinement.

### 5. Preview table needs default columns plus optional expansion

- Default must-show fields should stay practical and compact: company name, domain, location, employee range, industry, and Apollo identifier/status.
- Additional Apollo-returned data should be opt-in through a selectable column model rather than a permanently over-wide table.
- This implies Phase 2 needs a normalized company row shape plus metadata about optional previewable fields.

## Planning Implications

1. Start with a filter-definition and request-validation layer before building UI controls.
2. Add a dedicated company snapshot repository and normalized response model before wiring the preview page.
3. Keep the search button and “get latest snapshot” button as separate actions.
4. Treat preview-column configuration as presentation state on top of the stored snapshot, not as a reason to re-query Apollo.
5. Include broad-search warnings and snapshot freshness information in the same operator surface as the results.

## Risks to Cover in Plans

- Re-querying Apollo unnecessarily instead of reusing snapshots.
- Letting frontend inputs drift from Apollo’s actual accepted parameters.
- Treating “all pages fetched” as “all matching results retrieved” near the 50,000-record cap.
- Burying warnings so the user misses that a broad search may be wasteful.

## Recommended Plan Shape

- **Plan 02-01:** Filter contract, backend search service, and snapshot persistence.
- **Plan 02-02:** Search UI, preview table, selectable columns, and explicit search/latest-snapshot actions.
- **Plan 02-03:** Broad-search warnings, snapshot freshness/reuse flow, and final UX polish/verification.

## Sources

- `.planning/research/ARCHITECTURE.md`
- `.planning/research/PITFALLS.md`
- `.planning/phases/02-company-search-and-snapshot-preview/02-CONTEXT.md`
- Apollo Organization Search docs: `https://docs.apollo.io/reference/organization-search`
- Apollo People API Search docs: `https://docs.apollo.io/reference/people-api-search`

---
*Research complete for Phase 02*
