# Apollo Lead Finder

## What This Is

Apollo Lead Finder is a single-user web tool for running Apollo.io company searches, turning matching companies into people searches, and retrieving verified email addresses for qualified contacts. It is designed to get from search filters to a verified-email CSV in one session while minimizing unnecessary Apollo API calls and making credit usage visible before and during a run.

## Core Value

Turn precise Apollo filters into verified-email exports quickly without wasting API credits.

## Requirements

### Validated

- [x] Save reusable recipes that remember Apollo search inputs only — validated in Phase 1 and refined after Phase 3 UI cleanup.
- [x] Show current Apollo API usage data in the frontend before search execution — validated in Phase 1.
- [x] Search Apollo companies using configurable filter criteria and reuse snapshots safely — validated in Phase 2.
- [x] Search Apollo people from matched companies in both manual-select and all-company modes — validated in Phase 3.
- [x] Show pre-retrieval estimate and configurable run caps before retrieval execution — validated in Phase 3.

### Active

- [ ] Retrieve and display verified email contacts with exportable CSV output

### Out of Scope

- Multi-user accounts and admin features — this is a personal internal tool for now
- Contact channels beyond verified email — direct dials and other enrichment data are not needed in v1
- Unbounded bulk enrichment runs — credit preservation matters more than maximizing raw throughput

## Context

The tool is intended for the project owner's own use, not for a team or external customers. The workflow starts with company-level targeting, then applies person-level targeting to either manually selected companies or every matched company. The frontend should be easy to use for repeated prospecting sessions and should make recipe reuse practical.

Apollo basic-plan efficiency is a primary product concern. The system should avoid unnecessary API calls, surface usage and credit impact clearly, and estimate likely cost before the user commits to a run. Success for v1 means the user can go from filters to a verified-email CSV in one session with confidence about API usage.

## Constraints

- **API Budget**: Preserve Apollo credits/tokens as much as possible — the product must minimize unnecessary API calls under the Apollo basic plan
- **User Model**: Single-user workflow only — no need to solve collaboration, roles, or tenancy in v1
- **Primary Data**: Verified emails only — v1 should optimize for this outcome instead of broad contact enrichment
- **UX Goal**: One-session completion from filters to CSV — the flow should stay straightforward and operationally visible

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Build the first version as a single-user web application | The tool is only for personal use right now, so multi-user complexity would slow delivery without adding value | Validated in Phase 1 |
| Support both manual company selection and all-company people-search execution | Some runs need tighter control while others should be repeatable end-to-end | — Pending |
| Keep recipes focused on repeatable Apollo query inputs only | Export layout belongs to snapshot/run context so search recipes stay reusable and narrow in purpose | Validated after Phase 3 UI cleanup |
| Reuse matching company snapshots by default and make refresh explicit | Company search is credit-bearing, so the safe default should avoid silent repeat calls | Validated in Phase 2 |
| Keep company-search inputs aligned with Apollo request semantics | Input drift creates invalid searches and poor UX, so the filter contract must drive control choice | Validated in Phase 2 |
| Keep people preview snapshot-bound before retrieval planning | Retrieval should begin from reviewed, persisted preview state rather than transient search output | Validated in Phase 3 |
| Require explicit plan confirmation before retrieval readiness | Credit-sensitive retrieval work should be gated by visible estimate review and stop conditions | Validated in Phase 3 |
| Focus v1 enrichment on verified emails only | Verified email is the only contact detail that matters right now, which keeps scope and API spend tighter | — Pending |
| Expose usage monitoring and pre-run cost estimation in the frontend | Credit preservation is a core success criterion, not a secondary admin concern | Usage visibility validated in Phase 1; cost estimation validated in Phase 3 |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `$gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `$gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-23 after Phase 3 execution*
