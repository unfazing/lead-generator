# Apollo Lead Finder

## What This Is

Apollo Lead Finder is a single-user web tool for running Apollo.io company searches, turning matching companies into people searches, and retrieving verified email addresses for qualified contacts. It is designed to get from search filters to a verified-email CSV in one session while minimizing unnecessary Apollo API calls and making credit usage visible before and during a run.

## Core Value

Turn precise Apollo filters into verified-email exports quickly without wasting API credits.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Search Apollo companies using configurable filter criteria
- [ ] Search Apollo people from matched companies in both manual-select and all-company modes
- [ ] Retrieve and display verified email contacts with exportable CSV output
- [ ] Save reusable recipes that remember both search filters and output/export configuration
- [ ] Show API usage, credit consumption, and pre-run cost estimates in the frontend

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
| Build the first version as a single-user frontend application | The tool is only for personal use right now, so multi-user complexity would slow delivery without adding value | — Pending |
| Support both manual company selection and all-company people-search execution | Some runs need tighter control while others should be repeatable end-to-end | — Pending |
| Save recipes with both search filters and output/export setup | Repeated prospecting sessions should require minimal reconfiguration | — Pending |
| Focus v1 enrichment on verified emails only | Verified email is the only contact detail that matters right now, which keeps scope and API spend tighter | — Pending |
| Expose usage monitoring and pre-run cost estimation in the frontend | Credit preservation is a core success criterion, not a secondary admin concern | — Pending |

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
*Last updated: 2026-03-23 after initialization*
