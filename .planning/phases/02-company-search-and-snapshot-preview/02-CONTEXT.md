# Phase 2: Company Search and Snapshot Preview - Context

**Gathered:** 2026-03-23
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase adds company search execution, paginated company preview, and reusable company snapshots on top of the Phase 1 recipe workspace. It does not include people search, enrichment, or export. The goal is to let the user deliberately run Apollo company searches from saved or in-progress recipe filters, inspect the results safely, and reuse or refresh snapshots without accidental credit burn.

</domain>

<decisions>
## Implementation Decisions

### Search triggering and snapshot refresh
- **D-01:** Company search must run only when the user explicitly clicks a button. No auto-refresh behavior.
- **D-02:** If a matching snapshot already exists, the UI should show and reuse that snapshot by default.
- **D-03:** When a snapshot exists, the user should have a separate explicit action to fetch the latest snapshot from Apollo.
- **D-04:** If no snapshot exists yet, the user must explicitly click to retrieve results from Apollo.

### Company preview presentation
- **D-05:** The company results table should default to the current must-show fields: company name, domain, location, employee range, industry, and Apollo company identifier or status.
- **D-06:** The user should be able to optionally view additional Apollo-returned company data through selectable columns in the frontend.
- **D-07:** Phase 2 should feel like the existing operator console: dense, practical, and review-oriented rather than a lightweight browse experience.

### Guardrails and broad-search handling
- **D-08:** Broad company searches should allow continuation with a visible warning rather than hard-blocking the user.
- **D-09:** The warning should make it clear that broad organization search can waste credits and may require narrowing or partitioning.
- **D-10:** Search reuse and snapshot behavior should be designed to reduce duplicate Apollo calls by default.

### Apollo parameter validation and input design
- **D-11:** Search inputs must be validated against Apollo’s official request parameter contract before implementation is finalized.
- **D-12:** Frontend controls must match Apollo parameter shape: constrained enumerations or boolean-like parameters should use constrained controls; open-ended parameters should use text inputs or structured multi-value inputs.
- **D-13:** The search form should prioritize a pleasant operator experience while staying faithful to Apollo’s API semantics rather than exposing arbitrary or mismatched inputs.

### the agent's Discretion
- Exact table interactions such as column picker UI, sorting affordances, and row density.
- Exact wording and placement of broad-search warnings, as long as they are visible before the user proceeds.
- The concrete persistence mechanism for snapshots, provided it preserves replayability and explicit refresh behavior.

</decisions>

<specifics>
## Specific Ideas

- Reuse existing snapshots by default and make “get latest snapshot” a separate deliberate action.
- Keep the current default company preview fields, but let the user reveal more Apollo-returned fields through selectable columns.
- Validate search forms against official Apollo request docs so enum-style parameters become constrained controls and free-form parameters remain text-friendly.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Product scope and roadmap
- `.planning/PROJECT.md` — project constraints, validated Phase 1 scope, and single-user/credit-preservation priorities.
- `.planning/REQUIREMENTS.md` — Phase 2 requirements `COMP-01` through `COMP-04`.
- `.planning/ROADMAP.md` — Phase 2 goal, requirement mapping, and success criteria.
- `.planning/STATE.md` — current project position and active concerns.

### Prior phase context and shipped code
- `.planning/phases/01-recipe-and-usage-foundation/01-CONTEXT.md` — prior UI and workflow decisions that Phase 2 should preserve.
- `.planning/phases/01-recipe-and-usage-foundation/01-01-SUMMARY.md` — app foundation and shared schema decisions.
- `.planning/phases/01-recipe-and-usage-foundation/01-02-SUMMARY.md` — recipe workspace and persistence patterns.
- `.planning/phases/01-recipe-and-usage-foundation/01-03-SUMMARY.md` — usage telemetry behavior and server-only Apollo access pattern.

### Research guidance
- `.planning/research/SUMMARY.md` — roadmap implications and search-first workflow rationale.
- `.planning/research/ARCHITECTURE.md` — “search then materialize” pattern and preview-store guidance.
- `.planning/research/PITFALLS.md` — credit burn, broad-search cap, and snapshot reuse pitfalls.
- `.planning/research/STACK.md` — server runtime and backend-boundary guidance.

### Apollo API references
- `https://docs.apollo.io/reference/organization-search` — official organization search endpoint behavior, credit usage, and paging constraints.
- `https://docs.apollo.io/reference/people-api-search` — official people search contract used as the reference example for future input-shape validation and request/UI alignment.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/app/recipes/page.tsx` — current workspace shell that should absorb company search and snapshot preview without replacing the recipe-first flow.
- `src/lib/db/repositories/recipes.ts` — durable recipe persistence pattern that Phase 2 can mirror for company snapshots.
- `src/lib/recipes/schema.ts` — recipe shape already carries company filters, so company search should build directly on this schema instead of inventing a parallel form shape.
- `src/features/recipes/components/recipe-editor.tsx` — existing dense operator-form style that should inform Phase 2 search controls.

### Established Patterns
- Apollo access is server-only and should stay behind app routes or server modules.
- The UI is intentionally dense and operational, not a wizard or browse-heavy dashboard.
- Explicit user-triggered actions are already favored over hidden persistence or auto-running behavior.

### Integration Points
- Company search should attach to the existing recipe workspace and selected recipe context.
- Snapshot persistence will likely need a sibling repository/store to the existing recipe repository.
- Column-selection behavior should fit the current workspace layout rather than becoming a separate advanced settings flow.

</code_context>

<deferred>
## Deferred Ideas

- People search and company-selection handoff belong to Phase 3.
- Cost estimation before verified-email retrieval belongs to Phase 3.
- Enrichment, asynchronous run monitoring, and export remain in later phases.
- Any capability beyond Apollo-returned company data for preview columns is out of scope for this phase.

</deferred>

---

*Phase: 02-company-search-and-snapshot-preview*
*Context gathered: 2026-03-23*
