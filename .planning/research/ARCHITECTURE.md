# Architecture Research

**Domain:** Single-user Apollo API lead-generation workflow tool
**Researched:** 2026-03-23
**Confidence:** HIGH

## Standard Architecture

### System Overview

```text
┌────────────────────────────────────────────────────────────────────────────┐
│                               Presentation Layer                          │
├────────────────────────────────────────────────────────────────────────────┤
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐              │
│  │ Search Builder │  │ Results/Preview│  │ Run Monitor    │              │
│  └───────┬────────┘  └───────┬────────┘  └───────┬────────┘              │
│          │                   │                   │                       │
├──────────┴───────────────────┴───────────────────┴───────────────────────┤
│                            Application/API Layer                          │
├────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ Lead Finder Backend                                                 │  │
│  │                                                                      │  │
│  │  Recipe API   Search Service   Run Planner   Run Executor           │  │
│  │  Preview API  Credit Estimator Queue/Batcher Export Service         │  │
│  │  Usage API   Selection API   Progress Tracker                       │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
├────────────────────────────────────────────────────────────────────────────┤
│                            Persistence/Integration                        │
├────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │ SQLite/Postg.│  │ Job State DB │  │ CSV Files    │  │ Apollo API   │   │
│  │ Recipes/Cache│  │ Runs/Batches │  │ Exports      │  │ Search/Enrich│   │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘   │
└────────────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| Frontend workflow UI | Owns filters, company preview, people preview, run controls, usage visibility | Single-page app with route-level screens for recipe editing and run execution |
| Backend API | Sole trusted boundary for Apollo keys, validation, orchestration commands, and export generation | Monolithic server with REST handlers plus internal services |
| Search service | Calls Apollo organization search and people search endpoints, normalizes responses, paginates safely | Service module wrapping Apollo API client |
| Run planner | Converts selected companies plus person filters into executable batches and estimated credit cost | Pure planning service backed by persisted draft run records |
| Run executor | Processes batches, throttles Apollo calls, persists checkpoints, retries transient failures | Background worker in the same app process for v1 |
| Credit estimator and usage monitor | Tracks estimated vs actual credit use and available rate-limit headroom | Service reading local run history plus Apollo usage-stats endpoint |
| Preview/read model | Materializes cheap-to-read datasets for UI tables without rerunning Apollo calls | Database tables keyed by recipe, search signature, and run |
| Export service | Produces final CSV from verified contacts only, with run metadata if needed | Server-side CSV writer over persisted contact results |
| Persistence layer | Stores recipes, search snapshots, selected companies, planned batches, enriched contacts, and exports | SQLite for local-first v1; Postgres only if remote deployment is required |

## Recommended Project Structure

```text
src/
├── app/                    # HTTP entrypoints and dependency wiring
│   ├── routes/             # REST handlers for search, runs, recipes, exports
│   └── workers/            # Background executor bootstrap
├── modules/
│   ├── apollo/             # Apollo client, DTO mapping, rate-limit handling
│   ├── recipes/            # Saved filter/output configurations
│   ├── search/             # Company search, people search, preview read models
│   ├── runs/               # Plan, execute, resume, cancel
│   ├── credits/            # Cost estimation and usage snapshots
│   └── exports/            # CSV generation and download metadata
├── db/
│   ├── schema/             # Migrations and table definitions
│   └── repositories/       # Persistence interfaces per module
├── shared/                 # Types, validation schemas, helpers
└── ui/                     # Frontend screens and client-side state
```

### Structure Rationale

- **`modules/`:** Keeps business boundaries aligned with user workflow rather than technical layers. That matters here because search, planning, execution, and export have different correctness and cost concerns.
- **`app/`:** Keeps transport and process bootstrapping thin so the orchestration logic remains testable without HTTP.
- **`db/`:** Makes it explicit that cached previews and run state are first-class product data, not incidental implementation detail.
- **`ui/`:** The frontend should consume stable backend contracts, not Apollo directly. This isolates key management and throttling.

## Architectural Patterns

### Pattern 1: Search Then Materialize

**What:** Run Apollo searches into local snapshot tables before the user commits to enrichment.
**When to use:** Always for company search and people preview.
**Trade-offs:** Adds persistence complexity, but it avoids duplicate API calls, enables manual selection, and makes cost estimates stable.

**Example:**
```typescript
const companySnapshot = await searchService.searchCompanies(filters);
await previewStore.saveCompanies(runDraftId, companySnapshot.items);

const selectedCompanyIds = await selectionStore.listSelectedCompanies(runDraftId);
const peoplePreview = await searchService.searchPeople(personFilters, selectedCompanyIds);
await previewStore.savePeople(runDraftId, peoplePreview.items);
```

### Pattern 2: Plan/Execute Split

**What:** Separate "what will run" from "run it now."
**When to use:** For any enrichment step that can consume credits.
**Trade-offs:** Slightly more UI and schema work, but it is the right boundary for showing estimates, asking for confirmation, and resuming partial runs.

**Example:**
```typescript
const plan = await runPlanner.create({
  companyIds,
  personFilters,
  enrichmentMode: "verified_email_only",
});

return {
  estimatedCredits: plan.estimatedCredits,
  batchCount: plan.batches.length,
  candidateCount: plan.candidateCount,
};
```

### Pattern 3: Persistent Batch Executor

**What:** Execute enrichment in small persisted batches with checkpointing after each batch.
**When to use:** For Apollo enrichment calls, especially because bulk enrichment tops out at 10 people per call and consumes credits.
**Trade-offs:** Slightly slower than naive parallel fan-out, but much safer for a single-user internal tool where credit preservation matters more than maximum throughput.

**Example:**
```typescript
for (const batch of await runRepo.nextPendingBatches(runId)) {
  const result = await apollo.enrichPeople(batch.contacts);
  await runRepo.markBatchComplete(batch.id, result);
  await usageService.recordActualCost(runId, result);
}
```

## Data Flow

### Request Flow

```text
[User sets company filters]
    ↓
[Frontend Search Builder]
    ↓
[Backend Search API]
    ↓
[Apollo Organization Search]
    ↓
[Local Company Snapshot Store]
    ↓
[Results/Preview UI]
```

```text
[User selects companies or chooses all]
    ↓
[Backend People Preview API]
    ↓
[Apollo People Search]
    ↓
[Local People Preview Store]
    ↓
[Run Planner]
    ↓
[Estimated credits + planned batches]
```

```text
[User confirms run]
    ↓
[Run Executor]
    ↓
[Batch queue of up to 10 people per enrichment call]
    ↓
[Apollo People/Bulk Enrichment]
    ↓
[Persist enriched contacts + batch status + actual usage]
    ↓
[Export Service]
    ↓
[Verified-email CSV]
```

### State Management

```text
[Server-backed workflow state]
    ↓
[UI queries current draft run / recipe / previews]
    ↓
[User actions mutate via backend APIs]
    ↓
[Backend writes canonical state]
    ↓
[UI re-fetches read models for preview, progress, and export]
```

### Key Data Flows

1. **Recipe to search draft:** Saved recipe parameters are copied into a mutable run draft so each session is auditable and can diverge from the template.
2. **Company snapshot to people preview:** Company search results are persisted first; people search consumes either explicit selected company IDs or the complete company snapshot.
3. **Preview to batch plan:** The run planner turns preview candidates into enrichment batches, estimates credits, and records a deterministic execution plan before any paid call is made.
4. **Execution to export:** Only successfully enriched contacts meeting the verified-email criteria flow into the export dataset.
5. **Apollo usage to UI telemetry:** Usage snapshots and local actual-cost counters feed the run monitor so the operator sees both platform limits and session consumption.

## Component Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| UI ↔ Backend API | HTTP/JSON | UI never calls Apollo directly; backend owns keys, validation, and throttling |
| Search module ↔ Apollo client | Direct service call | Apollo-specific pagination, endpoint choice, and retry rules stay isolated here |
| Search module ↔ Preview store | Repository API | Search writes immutable snapshots; UI reads from local snapshots |
| Planner ↔ Executor | Database-backed run/batch records | The executor should consume persisted plans, not in-memory arrays |
| Executor ↔ Credits module | Direct service call plus persisted usage rows | Estimated and actual cost must be recorded separately |
| Export service ↔ Run results | Repository API | Export reads only finalized verified-contact rows |

## Build Order Implications

1. **Apollo client + backend shell first:** The project needs a secure server boundary before anything else because people search and usage stats require a master key, and no Apollo key should live in the frontend.
2. **Company search snapshots second:** This is the first useful slice and establishes the persistence model for cached previews.
3. **Selection + people preview third:** Manual-select and all-company modes both depend on persisted company snapshots and normalized people-search reads.
4. **Run planner and credit estimator fourth:** This is the product-defining boundary because it surfaces expected cost before enrichment and creates resumable plans.
5. **Batch executor and progress tracking fifth:** Only after planning exists should paid enrichment be wired in; otherwise the product will burn credits during iteration.
6. **Export and recipe reuse last:** They are important, but both depend on the core search/plan/execute data model being stable.

### Dependency Chain

```text
Apollo client/backend shell
    → company search snapshotting
    → company selection + people preview
    → run planning + credit estimation
    → batch execution + progress monitor
    → CSV export + saved recipes
```

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| Single user / v1 | Monolith, one database, in-process worker, serialized or lightly parallel enrichment |
| Small internal usage | Move worker into a separate process and add a proper job queue if long-running runs block the web process |
| Larger team/multi-user | Add tenancy, stronger quota controls, per-user run ownership, and probably move from SQLite to Postgres |

### Scaling Priorities

1. **First bottleneck:** Long-running enrichment execution inside the web process. Fix by separating worker execution from request handling before introducing more architecture.
2. **Second bottleneck:** Large preview datasets from wide Apollo searches. Fix by enforcing narrow filters, pagination, and snapshot expiry instead of overbuilding distributed systems.

## Anti-Patterns

### Anti-Pattern 1: Frontend Directly Calls Apollo

**What people do:** Put the Apollo key in the browser and wire the UI straight to Apollo endpoints.
**Why it's wrong:** It leaks credentials, makes rate limiting uncontrollable, and prevents trustworthy credit accounting.
**Do this instead:** Route all Apollo access through a backend API with explicit search, plan, execute, and export boundaries.

### Anti-Pattern 2: Search and Enrich in One Uncheckpointed Loop

**What people do:** Fetch people and immediately enrich them in the same transient request cycle.
**Why it's wrong:** It hides cost before execution, makes retries duplicate work, and causes partial-run ambiguity when the process dies.
**Do this instead:** Persist search snapshots, create a plan, then execute tracked batches with resumable status.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Apollo Organization Search | Backend REST client | Use for top-of-funnel company discovery; organization search should feed local snapshots, not direct export |
| Apollo People API Search | Backend REST client | Does not consume credits, requires a master API key, and has a 50,000 displayed-record limit that reinforces batched preview flows |
| Apollo People/Bulk Enrichment | Backend REST client | Credit-consuming step; bulk enrichment is capped at 10 people per call and is the natural execution-batch size. Treat webhook-based waterfall enrichment as a later extension, not a v1 dependency |
| Apollo Usage Stats | Backend REST client | Requires a master API key; use to reconcile local estimates and show rate-limit headroom |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `recipes ↔ search` | API + shared filter schema | Recipes should store filter intent, not cached results |
| `search ↔ runs` | Draft run IDs and preview references | Runs consume persisted preview sets instead of recalculating search results |
| `runs ↔ exports` | Run/result repositories | Export should be pure projection over completed run data |

## Sources

- Apollo API docs overview: https://docs.apollo.io/ (official, HIGH confidence)
- Apollo People API Search: https://docs.apollo.io/reference/people-api-search (official, HIGH confidence)
- Apollo Bulk People Enrichment: https://docs.apollo.io/reference/bulk-people-enrichment (official, HIGH confidence)
- Apollo People Enrichment: https://docs.apollo.io/reference/people-enrichment (official, HIGH confidence)
- Apollo Organization Search: https://docs.apollo.io/reference/organization-search (official, HIGH confidence)
- Apollo API Usage Stats and Rate Limits: https://docs.apollo.io/reference/view-api-usage-stats (official, HIGH confidence)
- Apollo Waterfall Enrichment guide: https://docs.apollo.io/docs/enrich-phone-and-email-using-data-waterfall (official, HIGH confidence)

---
*Architecture research for: single-user Apollo API lead-generation workflow tool*
*Researched: 2026-03-23*
