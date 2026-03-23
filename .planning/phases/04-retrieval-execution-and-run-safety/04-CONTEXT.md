# Phase 4: Retrieval Execution and Run Safety - Context

**Gathered:** 2026-03-24
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase turns reviewed people snapshots and ready run plans into actual Apollo `match` / `bulk_match` verified-email enrichment runs. It covers durable execution, live progress/status visibility, resume-safe state after interruptions, actual-versus-estimated usage reporting, and pre-enrichment dedupe or reuse checks. It does not change the search workflows, add export behavior, or broaden enrichment beyond verified email outcomes.

</domain>

<decisions>
## Implementation Decisions

### Retrieval execution model
- **D-01:** Verified-email retrieval must remain a fully explicit operator action that starts only from a reviewed people snapshot and a confirmed run plan.
- **D-02:** Retrieval execution state, Apollo credentials, credit accounting, and any provider-facing orchestration must stay server-side.
- **D-03:** The run should be durable enough that the operator can reload the app and still inspect the latest known status without losing trust in what has already been processed.
- **D-04:** Phase 4 should explicitly implement the enrichment workflow around Apollo `match` and `bulk_match`, rather than a generic retrieval abstraction with the concrete endpoint choice deferred.

### Run monitoring and operator visibility
- **D-05:** The frontend should expose run progress in a compact operational view, emphasizing status, processed counts, stop-condition state, and whether the run is active, interrupted, completed, or failed.
- **D-06:** Estimated-versus-actual usage should be visible after or during execution in a practical summary, so the operator can tell whether the run behaved within expectations.
- **D-07:** Progress visibility should stay aligned with the current search-first workflow style: dense, review-oriented, and easy to resume from, not a wizard.

### Resume safety and interruption handling
- **D-08:** Interrupted runs should be inspectable and resumable from persisted state rather than silently restarting from scratch.
- **D-09:** Resume behavior should protect against accidental double-processing by making prior progress and remaining work visible before continuing.
- **D-10:** The phase should favor trustworthy persisted state over optimistic UI assumptions whenever run status is uncertain.

### Dedupe, reuse, and result quality
- **D-11:** Before enrichment begins, the system should avoid unnecessary repeat processing through explicit dedupe or reuse checks against prior work.
- **D-12:** Apollo `match` / `bulk_match` outcomes must distinguish verified business-email results from non-verified, unavailable, or otherwise unusable results before Phase 5 export work begins.
- **D-13:** Dedupe and quality signals should be stored with run state so later export and rerun phases can build on them without reprocessing ambiguity.

### Auto-selected discussion defaults
- **Auto:** Use a single active-run operator surface rather than splitting monitoring into a separate admin area.
- **Auto:** Persist execution checkpoints at batch boundaries or other natural server-side progress points, not only at final completion.
- **Auto:** Treat reused/deduped contacts as visible run outcomes, not hidden skips, so actual-versus-estimated reporting stays trustworthy.

### the agent's Discretion
- Exact naming and placement of run-status badges, as long as active vs interrupted vs completed state is obvious.
- Exact checkpoint granularity and storage shape, provided the operator can safely inspect and resume runs.
- Exact presentation of quality categories, as long as verified business email remains the clearly preferred outcome.

</decisions>

<specifics>
## Specific Ideas

- Extend the current search workflow rather than creating a separate execution product surface.
- Keep “ready to run” and “currently running / previously run” states operationally close, so the user can move from reviewed people snapshot to monitored execution without losing context.
- Make actual usage and dedupe outcomes legible enough that a future export step can trust the run record without re-deriving execution history.
- Build the first execution path specifically around Apollo `people/match` and `people/bulk_match`, since those endpoints are the concrete enrichment path for verified-email acquisition in this product.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Product and roadmap
- `.planning/PROJECT.md` — Core value, server-side boundary, and credit-preservation constraints
- `.planning/REQUIREMENTS.md` — Phase 4 requirements: `COST-04`, `COST-05`, `EMAI-02`, `EMAI-03`, `EMAI-04`
- `.planning/ROADMAP.md` — Phase 4 goal, success criteria, and dependency on completed search and run-planning work
- `.planning/STATE.md` — current project position and concerns

### Prior phase decisions
- `.planning/phases/03-people-discovery-and-run-planning/03-CONTEXT.md` — reviewed people snapshots, explicit run-plan confirmation, and stop-condition expectations
- `.planning/phases/03.1-rework-the-search-flow/03.1-UAT.md` — search-first workflow validation and current operator flow expectations
- `.planning/phases/03.1-rework-the-search-flow/03.1-rework-the-search-flow-03-SUMMARY.md` — final people search and snapshot review behavior now in place

### Codebase guidance
- `.planning/codebase/ARCHITECTURE.md` — current layering, server actions, repository patterns, and workflow routes
- `.planning/codebase/STACK.md` — runtime and persistence constraints
- `.planning/codebase/CONCERNS.md` — file-backed persistence and execution durability concerns that affect Phase 4

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/features/run-planning/components/run-plan-panel.tsx`: Existing estimate and stop-condition UI that should remain the gateway into retrieval readiness.
- `src/features/run-planning/components/retrieval-readiness-gate.tsx`: Existing confirmation surface that can evolve into the handoff into durable execution.
- `src/lib/db/repositories/run-plans.ts`: Existing persisted run-plan storage that likely becomes the anchor for execution state.
- `src/features/people-search/components/saved-people-snapshots-panel.tsx`: Current people snapshot review surface that can anchor “run history” or execution state visibility without inventing a new search model.
- `src/app/recipes/actions.ts`: Current server-action boundary for search and plan mutations; likely the starting point for explicit retrieval-trigger actions.
- Apollo enrichment endpoint integrations should be added as explicit server-owned service modules for `match` / `bulk_match`, parallel to the existing Apollo search integrations.

### Established Patterns
- Operational state is server-backed and reloaded in server components rather than trusted to client memory.
- Search, snapshot review, and recipe editing are now workflow-specific and inline; Phase 4 should preserve that search-first structure instead of reintroducing separate standalone workspaces.
- Snapshot viewers share a common base component, so execution-related row state or export-adjacent controls should build on shared abstractions where possible.
- The app currently uses local JSON repositories, so any durable execution design must account for file-backed writes and restart recovery rather than assuming a queue or DB already exists.

### Integration Points
- Extend run-plan persistence to include execution lifecycle state and actual usage metrics.
- Add one or more repositories for retrieval runs, per-contact outcomes, or execution checkpoints adjacent to existing `src/lib/db/repositories/*` modules.
- Add workflow UI on top of current people snapshot and run-plan surfaces instead of inventing a third search route.
- Integrate dedupe/reuse checks before the provider call boundary and persist the decision/outcome for later reporting and export.

</code_context>

<deferred>
## Deferred Ideas

- Final CSV export shape, configurable export columns, and export dedupe/provenance formatting belong to Phase 5.
- Additional enrichment providers, recurring runs, or broader contact-channel retrieval remain out of scope for this phase.
- Any deployment migration away from file-backed persistence is a separate concern unless Phase 4 planning proves it is a hard blocker.

</deferred>

---

*Phase: 04-retrieval-execution-and-run-safety*
*Context gathered: 2026-03-24*
