# Project Research Summary

**Project:** Apollo Lead Finder
**Domain:** Single-user Apollo API prospecting and verified-email export workflow
**Researched:** 2026-03-23
**Confidence:** HIGH

## Executive Summary

Apollo Lead Finder is a server-backed prospecting workflow tool, not a browser-only lead scraper. The research consistently points to the same product shape: company discovery through Apollo organization search, persisted local snapshots for preview and selection, people discovery as a cheap intermediate step, then explicit verified-email enrichment and CSV export only after the user sees projected cost. Experts build this kind of tool as a backend-orchestrated workflow because Apollo keys, rate limits, usage reconciliation, and enrichment state cannot be managed safely or credibly in the frontend.

The recommended v1 approach is a TypeScript monolith built on Next.js, React, Node 24, and a relational database with Drizzle, with durable background orchestration for paid enrichment work. Product scope should stay narrow and opinionated: search companies, preview people, estimate cost, enrich only the qualified subset, export verified business emails, and save recipes. The differentiator is not breadth; it is making credit spend predictable and preventing waste.

The main risks are operational rather than visual. Apollo organization search burns credits during exploration, both search endpoints can silently truncate broad result sets at 50,000 records, and enrichment work becomes unreliable if it is treated as a synchronous request instead of a tracked multi-stage job. The mitigation is to force explicit checkpoints: snapshot search results, require a planning step before enrichment, batch and checkpoint execution, store strong identifiers and usage ledgers, and block export until records are finalized and quality-qualified.

## Key Findings

### Recommended Stack

The stack research is aligned with a modern server-rendered internal tool: `Next.js 15.5.2` with `React 19.1.1`, `TypeScript 5.9.2`, and `Node.js 24 LTS` for the application layer; `PostgreSQL 17` with `Drizzle ORM 0.44.5` and `drizzle-kit 0.31.4` for durable state; and `Inngest 3.40.2` for background execution, retries, and throttling. Tailwind is sufficient for the operator UI, while `zod`, TanStack Query/Table, `csv-stringify`, and `pino` cover validation, read models, export generation, and observability.

The most important stack decision is architectural, not cosmetic: keep Apollo and export logic on the Node runtime, not in the browser and not defaulting to Edge. The backend must own Apollo credentials, request normalization, search snapshots, cost estimation, batch execution, and export generation.

**Core technologies:**
- `Node.js 24 LTS`: runtime for the web app, jobs, and tooling; current stable LTS baseline for a 2026 greenfield build.
- `Next.js 15.5.2`: full-stack framework; gives secure server routes and fits a server-backed workflow UI.
- `React 19.1.1`: UI layer; mainstream pairing with Next 15.
- `TypeScript 5.9.2`: shared typing across Apollo payloads, recipes, plans, ledgers, and exports.
- `PostgreSQL 17`: durable state for recipes, snapshots, runs, batches, usage, and export history.
- `Drizzle ORM 0.44.5`: SQL-near schema control; better fit than heavier ORM abstraction for workflow-heavy state.
- `Inngest 3.40.2`: durable execution, throttling, retries, and resumability for enrichment jobs.

### Expected Features

The feature research is clear: launch the narrow workflow users already expect from prospecting tools, but make cost visibility and safe execution first-class. The product should feel like an Apollo-native, export-first operator tool rather than a broad GTM suite.

**Must have (table stakes):**
- Company search with Apollo filters.
- Result preview and selective execution before paid steps.
- People search from matched companies in both manual-select and all-company modes.
- Verified-business-email retrieval only for the qualified subset.
- Credit visibility and pre-run estimates.
- CSV export with configurable columns.
- Saved recipes covering both filters and output configuration.
- Duplicate suppression in exports.

**Should have (competitive):**
- Cost-aware run planner with projected spend ranges.
- Two-stage execution with dry-run previews before enrichment.
- Credit-preserving guardrails such as caps and stop conditions.
- Manual company shortlist mode as a deliberate control point.
- Recipe-based output presets and lightweight export reason codes.

**Defer (v2+):**
- Multi-provider fallback enrichment.
- CRM push or webhook handoff.
- Scheduled reruns.
- Additional channels like phone numbers or personal emails.
- Outreach sequencing, AI copy generation, and team/multi-user features.

### Architecture Approach

The architecture should follow one dominant pattern: search, materialize, plan, execute, then export. The UI owns filters, preview tables, and run controls; the backend owns Apollo access, validation, run planning, execution, credit estimation, and CSV generation; the database owns snapshots, run state, results, and ledgers; and the worker layer owns paid enrichment batches and retries. Search results should always be written to local snapshot tables first, plans should always be persisted before execution starts, and export should always be a projection over finalized verified-contact rows rather than a side effect of enrichment.

**Major components:**
1. Search and preview services — call Apollo search endpoints, normalize responses, and materialize local snapshots for company and people previews.
2. Run planner and credit estimator — convert selected preview sets into deterministic batches and projected spend before execution.
3. Run executor and progress tracker — process enrichment in small persisted batches with throttling, checkpointing, and resumable state.
4. Export service — generate CSVs from finalized verified-email rows only.
5. Persistence layer — store recipes, snapshots, selections, batches, usage snapshots, dedupe ledgers, and export metadata.

### Critical Pitfalls

1. **Exploratory company search burns credits** — make company search explicit, cache search snapshots, and show estimates before execution.
2. **Broad searches silently truncate at Apollo’s 50,000-result ceiling** — detect cap-adjacent queries and force refinement or deterministic partitioning.
3. **Enriching too early wastes credits** — separate discovery from reveal and enrich only the qualified final subset.
4. **Treating enrichment as final too soon corrupts exports and usage** — model enrichment as tracked background work with finalized-state gating before export.
5. **Weak identifiers and poor dedupe cause expensive rework** — carry forward Apollo IDs and related provenance, reject weak-match requests, and maintain a seen/enriched/exported ledger.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Secure Backend and Search Snapshotting
**Rationale:** Everything depends on a trusted backend boundary and durable local search snapshots; without this, credit control and replayability are impossible.
**Delivers:** Apollo backend client, recipe schema, company search flow, cached company snapshots, preview tables, and initial usage visibility.
**Addresses:** Company search, saved recipes foundation, result preview, and the first layer of credit visibility.
**Avoids:** Frontend-key leakage, exploratory search credit burn, and untracked duplicate company searches.

### Phase 2: People Preview, Planning, and Cost Controls
**Rationale:** The product’s core promise is not just finding leads but showing what a run will cost before paid enrichment starts.
**Delivers:** Company selection modes, people preview snapshots, deterministic run drafts, credit estimates, batch plans, stop conditions, and cap detection or partitioning rules.
**Uses:** Next.js server routes, TypeScript shared schemas, Drizzle persistence, and Apollo usage stats.
**Implements:** Search-to-plan split, preview read models, and run planner boundaries.
**Avoids:** 50,000-result blind spots, all-company overspend, and enriching before qualification.

### Phase 3: Enrichment Execution and Run Monitoring
**Rationale:** Paid work should only be added after planning exists; otherwise iteration burns credits and produces ambiguous partial state.
**Delivers:** Background execution, endpoint-aware throttling, persisted batch status, actual-versus-estimated usage tracking, and progress UI.
**Uses:** Inngest for durable execution, Postgres tables for batches and ledgers, and `pino` for traceable job logs.
**Implements:** Persistent batch executor and progress tracker.
**Avoids:** Synchronous enrichment assumptions, weak retry behavior, and rate-limit-driven partial runs.

### Phase 4: Verified Export, Dedupe, and Recipe Reuse
**Rationale:** Export quality is only trustworthy after finalized results, dedupe rules, and reuse semantics exist.
**Delivers:** Verified-business-email export policy, CSV generation, duplicate suppression, provenance columns, rerun reuse ledger, and polished recipe reruns.
**Addresses:** CSV export, duplicate suppression, recipe repeatability, and export-quality trust.
**Avoids:** Re-paying for the same people, low-trust mixed-quality CSVs, and non-reproducible reruns.

### Phase Ordering Rationale

- The architecture research explicitly recommends `backend shell -> company search snapshots -> people preview -> run planning -> batch execution -> export and recipes`.
- Feature dependencies say preview must exist before people search and credit visibility must gate retrieval, so planning cannot be deferred behind execution.
- Pitfall research shows most expensive failures happen when search and enrichment are merged too early; this ordering inserts checkpoints before every credit-bearing step.
- Export belongs after finalized execution and dedupe, because export quality is a projection of trustworthy run state, not a standalone feature.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 2:** Search partitioning strategy for Apollo’s 50,000-result cap needs concrete heuristics by filter dimension.
- **Phase 3:** If webhook-based waterfall enrichment is enabled in scope, job finalization and idempotent webhook handling need targeted phase research.
- **Phase 4:** Apollo contact conversion and local reuse policy may need focused validation if the roadmap includes avoiding repeat spend via saved-contact state.

Phases with standard patterns (skip research-phase):
- **Phase 1:** Secure backend setup, schema design, and search snapshotting are well-documented and already strongly grounded by official sources.
- **Phase 4:** Server-side CSV export and recipe CRUD are standard patterns as long as export remains a pure projection over finalized rows.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Versions and runtime choices were verified against official docs and package metadata; the main tradeoff is Postgres vs lighter local storage, not uncertainty about suitability. |
| Features | HIGH | Feature priorities align tightly with PROJECT.md and official Apollo behavior around search, enrichment, export, and credit usage. |
| Architecture | HIGH | The recommended workflow shape is consistent across official Apollo constraints and standard backend orchestration patterns for rate-limited paid APIs. |
| Pitfalls | HIGH | The highest-risk failure modes are directly supported by Apollo endpoint limits, credit semantics, and webhook behavior from official docs. |

**Overall confidence:** HIGH

### Gaps to Address

- **Database deployment choice:** `STACK.md` recommends managed Postgres, while `ARCHITECTURE.md` allows SQLite for local-first v1. Resolve this at roadmap time based on deployment target before phase planning locks the persistence model.
- **Webhook scope in v1:** `ARCHITECTURE.md` treats webhook-based waterfall enrichment as later scope, but `PITFALLS.md` correctly warns that enabling it changes the state model. Decide explicitly whether v1 supports Apollo waterfall before planning execution details.
- **Partitioning heuristics:** Research identifies the need to split broad searches near Apollo’s result cap, but not the exact default partition dimensions. Plan a validation task around the user’s real query patterns.
- **Saved-contact reuse depth:** Deduplication and local rerun suppression are clearly required, but Apollo contact-creation policy for this tool’s workflow needs a concrete implementation choice during planning.

## Sources

### Primary (HIGH confidence)
- https://docs.apollo.io/reference/organization-search — organization search behavior, credits, paging, and result limits.
- https://docs.apollo.io/reference/people-api-search — people discovery behavior, master-key requirement, and result limits.
- https://docs.apollo.io/reference/people-enrichment — enrichment lifecycle, async behavior, and credit implications.
- https://docs.apollo.io/reference/bulk-people-enrichment — bulk enrichment limits, throttling implications, and webhook behavior.
- https://docs.apollo.io/reference/view-api-usage-stats — usage reconciliation and rate-limit monitoring.
- https://docs.apollo.io/docs/enrich-phone-and-email-using-data-waterfall — waterfall timing and final credit semantics.
- https://nextjs.org/docs/app/building-your-application/routing/route-handlers — server-side orchestration boundary.
- https://nextjs.org/docs/app/guides/self-hosting — deployment/runtime guidance.
- https://www.inngest.com/docs — durable execution and concurrency controls.

### Secondary (MEDIUM confidence)
- https://knowledge.apollo.io/hc/en-us/articles/4423314404621-Email-Status-Overview — verified vs unverified email semantics.
- https://knowledge.apollo.io/hc/en-us/articles/6319289281805-Will-Apollo-Charge-Me-for-More-than-One-Email-per-Contact — email charging behavior.
- https://knowledge.apollo.io/hc/en-us/articles/6217107598861-Prospect-with-Personal-and-Business-Emails — business vs personal email and policy constraints.
- https://knowledge.apollo.io/hc/en-us/articles/4409237712141-Export-Contacts-from-Apollo-to-a-CSV — export behavior and non-enrichment caveat.
- https://hunter.io/bulks/email-finder — comparison point for reveal/export workflow expectations.
- https://www.clay.com/waterfall-enrichment — comparison point for multi-provider enrichment patterns to defer.

### Tertiary (LOW confidence)
- None. The roadmap-driving conclusions are already supported by primary and secondary sources.

---
*Research completed: 2026-03-23*
*Ready for roadmap: yes*
