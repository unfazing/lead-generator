# Phase 3: People Discovery and Run Planning - Context

**Gathered:** 2026-03-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Turn reviewed company snapshots into people-search previews and an explicit verified-email retrieval plan. This phase covers company selection modes, people preview storage, estimated cost visibility, stop conditions, and a confirmation gate before retrieval kickoff. It does not execute retrieval or export data.

</domain>

<decisions>
## Implementation Decisions

### Company-to-people selection flow
- **D-01:** The search page should let the user run people search in two modes only: selected companies or all companies from the active company snapshot.
- **D-02:** Manual company selection should happen from the existing company snapshot review surface, not from a separate wizard.
- **D-03:** The active company recipe and the active people recipe remain independently selectable on the search page, and Phase 3 uses that pairing as the source of truth for people preview runs.

### People preview behavior
- **D-04:** People search remains an explicit user-triggered action. No auto-run behavior should be introduced.
- **D-05:** People preview should feel operational and dense, similar to the company preview, with practical default columns first and optional detail only if already returned by Apollo.
- **D-06:** People preview results should be persisted as reusable local snapshots tied to the company selection mode and source company snapshot.

### Cost planning and safeguards
- **D-07:** The run planner should show an estimate before any verified-email retrieval can start, even if the estimate is conservative rather than exact.
- **D-08:** Stop conditions should be explicit user inputs in the plan step, at minimum supporting a maximum contacts cap.
- **D-09:** Retrieval can only be started from a reviewed people result set after the user confirms the plan.

### the agent's Discretion
- Exact table columns for the first people preview iteration, as long as title, company, location, and enough qualification context are visible.
- Whether manual company selection uses row checkboxes, persisted selection chips, or a compact side panel, as long as it stays on the search page.
- How cost estimate language is framed, as long as uncertainty and guardrails are clear.

</decisions>

<specifics>
## Specific Ideas

- Keep the operator-first feel established in Phase 2: direct actions, no multi-step wizard.
- Preserve credit-awareness in every state transition, even though Apollo people search itself is non-credit according to current docs; the plan still exists to protect the later retrieval step.
- Recipe authoring is now fully separate from operational search work, so Phase 3 should build on `/search`, not pull editing UI back into the run flow.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Product and roadmap
- `.planning/PROJECT.md` — Core value, credit-preservation constraints, and current workflow intent
- `.planning/REQUIREMENTS.md` — Phase 3 requirements: `PEOP-01`, `PEOP-02`, `PEOP-03`, `PEOP-04`, `COST-02`, `COST-03`, `EMAI-01`
- `.planning/ROADMAP.md` — Phase 3 goal, success criteria, and dependency on completed company snapshot work

### Prior phase decisions
- `.planning/phases/02-company-search-and-snapshot-preview/02-CONTEXT.md` — Explicit search triggers, snapshot reuse behavior, and Apollo-aligned input expectations
- `.planning/phases/02-company-search-and-snapshot-preview/02-VERIFICATION.md` — What the current search page and company snapshot system already guarantee

### Research
- `.planning/research/SUMMARY.md` — Recommended sequencing and major risks
- `.planning/research/PITFALLS.md` — Spend, truncation, and execution-model pitfalls that still affect Phase 3 planning

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/app/search/page.tsx`: Current operational page that already pairs company and people recipes and displays company snapshot results.
- `src/features/company-search/components/company-results-workspace.tsx`: Established pattern for a preview workspace with local interactive view state.
- `src/features/company-search/components/company-search-panel.tsx`: Existing operator-first search panel pattern with explicit actions and snapshot context.
- `src/features/recipes/components/recipe-list.tsx`: Reusable recipe selection list already used for company/people pairing.
- `src/features/usage/components/usage-summary.tsx`: Existing surface for showing usage or planning-related stats near the working area.

### Established Patterns
- Server actions are the current mutation path (`src/app/recipes/actions.ts`) and keep secrets and request shaping on the server.
- Snapshot persistence currently uses lightweight file-backed repositories in `src/lib/db/repositories/`.
- Search payload validation is centralized in shared schemas and Apollo-aligned filter-definition files.
- Operational search and recipe authoring are now split into different routes, so Phase 3 should extend `/search` rather than merge flows again.

### Integration Points
- Add people-search payload schema and Apollo request adapter parallel to `src/lib/company-search/schema.ts` and `src/lib/apollo/company-search.ts`.
- Add a people snapshot repository adjacent to `src/lib/db/repositories/company-snapshots.ts`.
- Extend `src/app/search/page.tsx` with company-selection controls, people preview states, and planning UI.
- Reuse selected company recipe, selected people recipe, and active company snapshot as the inputs to people-search execution and plan generation.

</code_context>

<deferred>
## Deferred Ideas

- Full verified-email retrieval execution, live progress, resume logic, and actual-vs-estimated reconciliation belong to Phase 4.
- CSV export behavior, dedupe in final exports, and rerun/export provenance belong to Phase 5.
- Additional UI refinements like saved view presets for people preview columns can wait until the core Phase 3 flow exists.

</deferred>

---

*Phase: 03-people-discovery-and-run-planning*
*Context gathered: 2026-03-23*
