# Phase 1: Recipe and Usage Foundation - Context

**Gathered:** 2026-03-23
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase establishes the first usable operator surface for Apollo Lead Finder: saved recipe creation and editing, durable persistence for recipe inputs, and baseline Apollo usage visibility in the frontend. It does not include company search results, people previews, run execution, or export flows yet.

</domain>

<decisions>
## Implementation Decisions

### Recipe shape and editing flow
- **D-01:** A recipe in v1 stores company filters, person filters, and export column settings together as one reusable workflow object.
- **D-02:** Recipe editing should be explicit, not auto-saved. The user should intentionally save or update a recipe.
- **D-03:** Phase 1 should support creating and editing recipes first; rerunning a full workflow from a saved recipe is deferred to Phase 5.

### Initial operator UI
- **D-04:** The first UI should feel like an internal operator tool: dense, practical, and server-backed rather than a marketing-style app shell.
- **D-05:** The Phase 1 screen should prioritize a simple recipe list plus a focused editor form, not a multi-step wizard.
- **D-06:** Single-user use is assumed. No authentication, role logic, or collaboration affordances belong in this phase.

### Usage visibility
- **D-07:** Apollo usage visibility should appear before any search action, as baseline account telemetry rather than post-run reporting.
- **D-08:** The frontend should show current usage in a compact summary format that is easy to scan while editing recipes.
- **D-09:** Usage data should emphasize credit preservation and account headroom, not billing or admin reporting depth.

### the agent's Discretion
- Form layout details, spacing, and exact information hierarchy within the operator UI.
- The specific persistence adapter chosen for local development, as long as it supports the roadmap and research constraints.
- The exact polling or refresh behavior for usage data, provided it keeps the UI understandable and does not create noisy network activity.

</decisions>

<specifics>
## Specific Ideas

- The product should feel like a deliberate internal operations console, not a lightweight browser hack or an enterprise dashboard.
- Recipes should be practical to reuse later, so the data model must already include export-column settings even though export itself ships in Phase 5.
- Usage visibility should be present early because Apollo credit preservation is a core product promise, not a later admin add-on.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Product scope and requirements
- `.planning/PROJECT.md` — project definition, non-negotiable constraints, and core value.
- `.planning/REQUIREMENTS.md` — v1 requirements for recipes and usage visibility, plus out-of-scope constraints.
- `.planning/ROADMAP.md` — phase goal, requirement mapping, and success criteria for Phase 1.
- `.planning/STATE.md` — current project position and active concerns affecting planning.

### Research guidance
- `.planning/research/SUMMARY.md` — synthesized research conclusions and roadmap rationale.
- `.planning/research/STACK.md` — recommended stack and server-boundary constraints for Apollo handling.
- `.planning/research/FEATURES.md` — why saved recipes and credit visibility are table-stakes for this product shape.
- `.planning/research/ARCHITECTURE.md` — backend-owned workflow boundaries and project structure guidance.
- `.planning/research/PITFALLS.md` — credit-burn and search/execution pitfalls that justify early usage visibility.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None yet — the repository is effectively greenfield aside from planning artifacts.

### Established Patterns
- Planning artifacts consistently assume a server-backed Apollo workflow, not direct browser access.
- The generated workflow guidance in `CLAUDE.md` and `AGENTS.md` expects future changes to flow through GSD phase execution.

### Integration Points
- Phase 1 work will establish the application shell, persistence primitives, and the first frontend/backend contracts that later search and execution phases build on.
- Recipe schema decisions in this phase must leave room for company filters, people filters, output columns, and later run settings without forcing a model rewrite.

</code_context>

<deferred>
## Deferred Ideas

- Company search submission and result preview belong to Phase 2.
- People preview, retrieval planning, and estimated run controls belong to Phase 3.
- Full recipe rerun behavior belongs to Phase 5.
- Authentication and multi-user controls remain out of scope for v1.

</deferred>

---

*Phase: 01-recipe-and-usage-foundation*
*Context gathered: 2026-03-23*
