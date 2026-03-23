# Roadmap: Apollo Lead Finder

## Overview

This roadmap turns Apollo Lead Finder into a focused, credit-aware workflow from saved filters to verified-email CSV export. The phases follow the product's real risk boundaries: define reusable recipes and secure server-side foundations first, materialize company and people previews before any paid step, add explicit run planning and safe retrieval controls, then finish with durable execution, export quality, and repeatable reruns.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Recipe and Usage Foundation** - Define reusable recipe state and expose baseline Apollo usage visibility. Completed 2026-03-23.
- [x] **Phase 2: Company Search and Snapshot Preview** - Let the user search Apollo companies, inspect results, and persist company snapshots safely. Completed 2026-03-23.
- [x] **Phase 3: People Discovery and Run Planning** - Turn reviewed companies into people previews and gated retrieval plans with estimated cost. Completed 2026-03-23.
- [ ] **Phase 4: Retrieval Execution and Run Safety** - Execute Apollo `match` / `bulk_match` verified-email enrichment with monitoring, resumability, and spend protection.
- [ ] **Phase 5: Verified Export and Repeatable Reruns** - Export trusted CSVs with provenance, dedupe, and recipe-driven replay.

## Phase Details

### Phase 1: Recipe and Usage Foundation
**Goal**: Users can define reusable Apollo prospecting recipes and see baseline account usage before starting searches.
**Depends on**: Nothing (first phase)
**Requirements**: [RECP-01, RECP-02, COST-01]
**Success Criteria** (what must be TRUE):
  1. User can create reusable company and people recipes that store Apollo query inputs for later reruns.
  2. User can reopen the app and still see previously saved recipes ready for editing or execution.
  3. User can see current Apollo API or credit usage information in the frontend before starting a run.
**Plans**: 3 plans

Plans:
- [x] 01-01: Create app shell, persistence primitives, and recipe data model
- [x] 01-02: Build recipe create/edit flows with shared validation
- [x] 01-03: Surface Apollo usage data in the frontend

### Phase 2: Company Search and Snapshot Preview
**Goal**: Users can search Apollo companies from the frontend, review paginated results, and persist reusable company snapshots without blind overspend.
**Depends on**: Phase 1
**Requirements**: [COMP-01, COMP-02, COMP-03, COMP-04]
**Success Criteria** (what must be TRUE):
  1. User can submit company-search filters from a saved or in-progress recipe and receive paginated company previews.
  2. User can persist a company result set as a local snapshot tied to the originating filters.
  3. User can see when a company search is too broad and must be refined before continuing.
**Plans**: 3 plans

Plans:
- [x] 02-01: Implement Apollo company search service and normalized snapshot storage
- [x] 02-02: Build company preview table and pagination flow
- [x] 02-03: Add broad-search warnings and snapshot reuse behavior

### Phase 3: People Discovery and Run Planning
**Goal**: Users can turn reviewed company snapshots into people previews and an explicit verified-email retrieval plan with visible cost controls.
**Depends on**: Phase 2
**Requirements**: [PEOP-01, PEOP-02, PEOP-03, PEOP-04, COST-02, COST-03, EMAI-01]
**Success Criteria** (what must be TRUE):
  1. User can run people search against either selected companies or all qualified companies from a saved company snapshot.
  2. User can preview matched people and persist the people snapshot tied to the source company selection.
  3. User can see an estimated credit cost and configured stop conditions before starting verified-email retrieval.
  4. User can start verified-email retrieval only from a reviewed people result set after confirming the plan.
**Plans**: 3 plans

Plans:
- [x] 03-01: Implement company-selection modes and people preview storage
- [x] 03-02: Build run planner with estimate calculation and stop-condition inputs
- [x] 03-03: Add reviewed-plan confirmation before retrieval kickoff

### Phase 03.1: Rework the search flow (INSERTED)

**Goal:** Users can work through separate company-search and people-search workflows, using first-class company snapshots to update people recipes with organization IDs and provenance before explicitly reviewing people snapshots.
**Requirements**: [COMP-02, COMP-03, COMP-04, PEOP-01, PEOP-02, PEOP-03, PEOP-04]
**Depends on:** Phase 3
**Plans:** 3/3 plans complete
**Completed:** 2026-03-24

Plans:
- [x] 03.1-01-PLAN.md — Split `/search` into instructions-first company and people workflow entry routes with no implicit defaults
- [x] 03.1-02-PLAN.md — Make company search produce first-class snapshots and let people search import organization IDs from company snapshots into people recipes with provenance
- [x] 03.1-03-PLAN.md — Add explicit people search execution and people snapshot review stages, then sync roadmap metadata

### Phase 4: Retrieval Execution and Run Safety
**Goal**: Users can run Apollo `match` / `bulk_match` verified-email enrichment safely, monitor progress live, and recover from interruptions without losing trustworthy cost and quality state.
**Depends on**: Phase 3
**Requirements**: [COST-04, COST-05, EMAI-02, EMAI-03, EMAI-04]
**Success Criteria** (what must be TRUE):
  1. User can start and monitor Apollo `match` / `bulk_match` enrichment progress and status from the frontend while a run is active.
  2. User can resume or safely inspect an interrupted retrieval run without losing batch state.
  3. User can compare estimated versus actual usage after a run completes.
  4. User can distinguish verified business-email results from non-verified or unusable outcomes before export.
  5. User can avoid unnecessary repeat processing through dedupe or reuse checks before enrichment starts.
**Plans**: 3 plans

Plans:
- [ ] 04-01: Implement durable Apollo `match` / `bulk_match` execution, throttling, and progress tracking
- [ ] 04-02: Add resume-safe run state and actual-usage reconciliation for enrichment runs
- [ ] 04-03: Enforce pre-enrichment dedupe and Apollo result-quality classification

### Phase 5: Verified Export and Repeatable Reruns
**Goal**: Users can export trusted verified-email CSVs and rerun successful workflows without rebuilding setup or re-exporting duplicates.
**Depends on**: Phase 4
**Requirements**: [RECP-04, EXPT-01, EXPT-02, EXPT-03, EXPT-04]
**Success Criteria** (what must be TRUE):
  1. User can load an existing recipe, rerun it, and reach export-ready results without re-entering filters.
  2. User can export verified-email results to CSV using the configured output columns from the active snapshot or run.
  3. Exported CSVs exclude duplicates and preserve source company, source run, and verification-status provenance.
**Plans**: 2 plans

Plans:
- [ ] 05-01: Build export service and configurable CSV column projection
- [ ] 05-02: Add export dedupe, provenance columns, and recipe rerun flow

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 2.1 -> 2.2 -> 3 -> 3.1 -> 4 -> 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Recipe and Usage Foundation | 3/3 | Complete | 2026-03-23 |
| 2. Company Search and Snapshot Preview | 3/3 | Complete | 2026-03-23 |
| 3. People Discovery and Run Planning | 3/3 | Complete | 2026-03-23 |
| 03.1. Rework the search flow | 3/3 | Complete | 2026-03-24 |
| 4. Retrieval Execution and Run Safety | 0/3 | Not started | - |
| 5. Verified Export and Repeatable Reruns | 0/2 | Not started | - |
