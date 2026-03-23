# Pitfalls Research

**Domain:** Apollo API lead search, enrichment, and verified-email CSV export
**Researched:** 2026-03-23
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: Burning credits during exploratory company search

**What goes wrong:**
Teams wire the UI so every filter tweak immediately hits Apollo organization search. That feels responsive, but Apollo's Organization Search consumes credits, so routine exploration becomes the main source of waste before any person-level enrichment happens.

**Why it happens:**
Developers assume search is cheap because Apollo's People API Search is non-credit, then apply the same interaction model to company search. They also skip local caching and cost previews in early versions.

**How to avoid:**
Make company search an explicit run action, not keystroke-driven live search. Cache normalized query payloads and results by recipe hash. Show a pre-run estimate with current organization-search cost assumptions, previous identical-run reuse, and a warning when a query is broad enough to require batching. Treat company search results as a reusable snapshot for downstream person search instead of re-querying Apollo during each step.

**Warning signs:**
- Users trigger repeated company searches while only adjusting one filter at a time.
- Credit spend rises before any verified emails are exported.
- The same organization query appears multiple times in logs with only seconds between runs.

**Phase to address:**
Phase 1: Search workflow, recipe model, and credit budget guardrails.

---

### Pitfall 2: Treating a 50,000-result search cap as the full market

**What goes wrong:**
The tool reports a run as "complete" even though Apollo only exposes up to 50,000 results per search request path. Broad company or people searches silently truncate the reachable dataset, so exports look valid but are incomplete.

**Why it happens:**
Apollo's search endpoints return paginated data successfully, so it is easy to confuse "all pages fetched" with "all matching records retrieved." The cap is operational, not an indication that no more records exist.

**How to avoid:**
Add hard detection for cap-adjacent searches. If page count approaches 500 pages or result count approaches 50,000, require the user to refine filters or let the tool auto-partition by geography, employee bands, funding stage, or another stable dimension. Persist partition metadata so reruns stay deterministic.

**Warning signs:**
- Result counts cluster suspiciously near 50,000.
- Runs consistently end at page 500.
- Export counts vary drastically after adding a trivial narrowing filter.

**Phase to address:**
Phase 1: Search planner and result-partitioning strategy.

---

### Pitfall 3: Enriching too early and too broadly

**What goes wrong:**
The system enriches every person found from company results before applying tighter contact filters or user selection. That converts a cheap discovery step into the main credit sink and produces many records that never make the CSV.

**Why it happens:**
People API Search does not return email addresses, so teams jump straight to enrichment for all discovered people. They optimize for "one click full run" before building good qualification gates.

**How to avoid:**
Separate discovery from reveal. Use people search to narrow candidates first, then enrich only the final qualified set. Support both manual company selection and all-company mode, but force all-company mode through an explicit estimate and row-count confirmation. Add batch ceilings, stop conditions, and a "verified-email yield" metric so the tool can abort low-efficiency runs.

**Warning signs:**
- Many enriched people never appear in the final export.
- Verified-email yield per enriched contact is low.
- Users cancel runs after credits have already been spent on unqualified leads.

**Phase to address:**
Phase 2: Person qualification pipeline and enrichment gating.

---

### Pitfall 4: Assuming enrichment is synchronous and final

**What goes wrong:**
The tool marks records complete from the initial enrichment response, then exports before Apollo's asynchronous waterfall webhook delivers final email results and final credit consumption. Exports end up missing emails, and usage reporting is wrong.

**Why it happens:**
Apollo's People Enrichment and Bulk People Enrichment endpoints return immediate responses even when waterfall enrichment is enabled. Without careful job-state modeling, that looks like success.

**How to avoid:**
Model enrichment as a multi-stage background job: `queued -> accepted -> webhook received -> finalized`. Store Apollo `request_id`, raw webhook payloads, final credits consumed, and per-record completion state. Do not allow export until all targeted records are finalized or explicitly marked timed out. Build webhook idempotency from the start because Apollo may retry deliveries.

**Warning signs:**
- Export row counts finish before background jobs settle.
- Credit totals change after the UI already showed the run as complete.
- Duplicate webhook deliveries create duplicate exported rows or state flips.

**Phase to address:**
Phase 2: Background-job orchestration, webhook ingestion, and run-state model.

---

### Pitfall 5: Weak person identifiers cause expensive no-match enrichments

**What goes wrong:**
Developers call people enrichment using loose identity data like name plus company text. Apollo accepts the request but enriches nothing, or enriches the wrong person, wasting credits and forcing cleanup.

**Why it happens:**
Search and enrichment are treated as loosely coupled steps. The implementation fails to carry forward Apollo person IDs, LinkedIn URLs, domain context, and source company identifiers from discovery into enrichment.

**How to avoid:**
Preserve the strongest available identifiers from search results and make them first-class fields in the pipeline. Prefer Apollo IDs or high-confidence identifiers over reconstructed payloads. Reject enrichment requests that fall below a minimum identifier threshold. Keep provenance on every row so bad matches can be traced back to the exact search snapshot.

**Warning signs:**
- Many enrichment responses return `200` with zero enriched records.
- Match rates drop sharply for manually edited or imported rows.
- Export quality issues cluster around contacts lacking strong identifiers.

**Phase to address:**
Phase 2: Candidate identity model and enrichment request builder.

---

### Pitfall 6: Re-paying for the same people because persistence is wrong

**What goes wrong:**
The tool enriches the same person across repeated runs because it does not persist prior access correctly or it creates duplicate Apollo contacts. Credits are spent again for data the user effectively already bought.

**Why it happens:**
Apollo distinguishes between transient net-new data access and saved contacts. Teams often stop after export generation and ignore contact persistence, dedupe, and local record reuse.

**How to avoid:**
Introduce a local "seen/enriched/exported/contact-created" ledger keyed by stable Apollo and email identifiers. When the product decides a person is worth keeping, convert enriched people into contacts and enable dedupe behavior instead of blindly re-enriching. On reruns, consult both local history and Apollo saved-contact state before spending credits again.

**Warning signs:**
- The same email appears in multiple runs with repeated enrichment spend.
- Apollo contact counts grow faster than unique exported contacts.
- Duplicate contacts appear because `run_dedupe` was not enabled or no dedupe check was performed.

**Phase to address:**
Phase 3: Persistence, deduplication, and rerun reuse rules.

---

### Pitfall 7: Exporting "has email" instead of exporting verified-email quality

**What goes wrong:**
The CSV looks populated, but rows mix verified, unverified, catch-all, unavailable, business-only, and policy-restricted outcomes. The downstream campaign treats all rows as equal quality, hurting deliverability and trust in the tool.

**Why it happens:**
Teams collapse Apollo's richer email semantics into a single boolean. They also miss that primary-email settings affect which email type is returned and that exporting existing records does not enrich them automatically.

**How to avoid:**
Define export eligibility explicitly: default to verified business email only for v1 unless the user opts into another mode. Include `email_status`, `email_type`, source/provenance, run timestamp, and enrichment method in the CSV. Separate "exportable row" from "enriched row." Add an export QA step that samples rows and checks Apollo status distribution before marking the run successful.

**Warning signs:**
- CSV rows contain email values but bounce performance or outreach quality is poor.
- Different runs return different email types for similar filters.
- Users assume export alone will reveal emails for previously saved but unenriched contacts.

**Phase to address:**
Phase 3: Export contract, verified-email policy, and quality gates.

---

### Pitfall 8: Ignoring rate limits and endpoint asymmetry in job design

**What goes wrong:**
Background workers flood Apollo, hit minute or hourly limits, and create partial runs, retries, and misleading failure states. Bulk enrichment is also misused as if it scales linearly, even though it is limited to 10 people per call and has a lower per-minute throttle.

**Why it happens:**
Implementations assume "bulk" means unrestricted throughput. They also centralize retry logic without a run-aware queue, so transient throttling becomes duplicated work or skipped records.

**How to avoid:**
Build per-endpoint concurrency controls backed by a queue that understands minute, hourly, and daily budgets. Separate company search, people search, and enrichment workers because their economics differ. Use small, resumable batches with checkpointing. Read Apollo usage stats during runs and degrade gracefully instead of driving the account into hard throttling.

**Warning signs:**
- Bursts of `429` or sudden failures after an initially healthy run.
- Some records finish while others remain in ambiguous retry states.
- Bulk enrichment workers show lower-than-expected throughput despite larger batch requests.

**Phase to address:**
Phase 2: Queueing, retry policy, and adaptive rate limiting.

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Re-run Apollo searches instead of caching snapshots | Less local state to manage | Repeated credit burn and irreproducible exports | Never |
| Store only final CSV rows, not per-step provenance | Faster MVP implementation | Impossible to explain spend, debug bad matches, or resume jobs safely | Never |
| Treat enrichment as a blocking HTTP request from the UI | Simple code path | Breaks when webhook-based waterfall enrichment is enabled | Only for a throwaway prototype with no waterfall support |
| Skip contact dedupe and saved-contact reuse | Faster initial shipping | Paying repeatedly for the same people and bloating Apollo contacts | Never |
| Collapse email quality into a single `has_email` flag | Simplifies export logic | Low-quality CSVs and hidden deliverability risk | Never |

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Apollo Organization Search | Treating search like a free browse endpoint | Meter it, cache it, and make broad searches explicit because it consumes credits |
| Apollo People API Search | Expecting it to return emails | Use it for net-new discovery only, then enrich the qualified subset |
| Apollo People/Bulk People Enrichment | Assuming the immediate response is final when waterfall is enabled | Wait for webhook completion and track `request_id` through finalization |
| Apollo Contacts API | Creating contacts without dedupe or reuse checks | Enable dedupe behavior and maintain a local uniqueness ledger |
| CSV export pipeline | Assuming exporting existing contacts also enriches them | Treat enrichment and export as separate steps and verify status before export |

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Single giant all-company run | Huge credit spikes, long tails, hard-to-debug partial failures | Partition runs and checkpoint every batch | Breaks as soon as searches become broad enough to approach the 50,000-result cap |
| No queue separation by endpoint | Search and enrichment block each other during retries | Use endpoint-specific workers and budget buckets | Breaks once concurrent runs share the same Apollo account limits |
| Export from in-memory job results only | Missing or duplicate rows after worker restarts | Materialize finalized rows in durable storage before CSV generation | Breaks on the first interrupted run or webhook replay |

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Putting the Apollo master API key in the frontend | Full account abuse, spend leakage, and exposure of privileged endpoints | Keep all Apollo calls server-side and scope secrets to backend workers only |
| Accepting webhook payloads without verification or replay protection | Fake completions, poisoned exports, and job corruption | Validate source expectations, record request IDs, and make webhook processing idempotent |
| Exporting personal emails by default | Compliance and policy problems, especially for EU/UK/CH prospects | Default v1 to verified business email only and require explicit mode changes for other email types |

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Showing only total results, not estimated credit impact | Users discover spend after the run, not before it | Put estimated search and enrichment cost next to every run action |
| Hiding asynchronous job stages | Users think the tool is stuck or finished incorrectly | Show counts for queued, enriched, waiting on webhook, finalized, and export-ready |
| Mixing saved recipes with mutable live results | Users cannot reproduce a previous successful export | Version recipes and tie runs to a frozen search snapshot |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Company search:** Often missing result-cap detection. Verify the tool warns or auto-partitions when a search approaches 50,000 records.
- [ ] **Enrichment jobs:** Often missing webhook finalization. Verify export is blocked until each target row is finalized or timed out explicitly.
- [ ] **Credit reporting:** Often missing actual post-run reconciliation. Verify the UI compares estimated versus final credits consumed.
- [ ] **Deduplication:** Often missing rerun reuse logic. Verify the same person is not re-enriched on a subsequent identical run.
- [ ] **CSV export:** Often missing email-quality columns. Verify `email_status`, email type, and provenance are included in the output schema.

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Exploratory search credit burn | MEDIUM | Freeze live search, add query caching, review usage logs, and convert high-frequency filters into saved recipes with estimates |
| Async enrichment exported too early | HIGH | Invalidate affected CSVs, replay finalized webhook states by `request_id`, regenerate exports from durable finalized rows |
| Weak-match enrichments | MEDIUM | Quarantine low-confidence rows, tighten identifier thresholds, and rerun only affected batches with stronger identifiers |
| Duplicate repayment for saved people | MEDIUM | Build a uniqueness ledger from prior exports and Apollo contacts, then suppress future enrichments for known records |
| Low-quality export semantics | MEDIUM | Reclassify historical rows by email status/type, regenerate CSVs, and change default export mode to verified business only |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Burning credits during exploratory company search | Phase 1: Search workflow and budget guardrails | A repeated identical company query reuses cached results and shows a pre-run estimate before spend |
| 50,000-result truncation | Phase 1: Search planner and partitioning | Broad searches are blocked or split automatically before page 500 is reached |
| Enriching too early and too broadly | Phase 2: Qualification and enrichment gating | The run logs show person search counts materially higher than enrichment counts by design |
| Async enrichment treated as final | Phase 2: Jobs and webhook orchestration | Export cannot begin while any target row is still only `accepted` and not finalized |
| Weak person identifiers | Phase 2: Identity model and request builder | Low-identifier requests are rejected locally and no-match enrichment rate stays within an acceptable bound |
| Ignoring rate limits and endpoint asymmetry | Phase 2: Queueing and adaptive throttling | Workers back off before hard throttling and can resume incomplete batches safely |
| Re-paying for the same people | Phase 3: Persistence and dedupe | A rerun over the same target set enriches only new people and reuses prior saved-contact state |
| Exporting poor email quality | Phase 3: Export contract and QA | CSVs default to verified business email rows and include status/type/provenance columns |

## Sources

- Apollo API docs: People API Search, which is non-credit and capped at 50,000 displayed records. https://docs.apollo.io/reference/people-api-search
- Apollo API docs: Organization Search, which consumes credits and is also capped at 50,000 displayed records. https://docs.apollo.io/reference/organization-search
- Apollo API docs: People Enrichment. Async waterfall delivery, webhook/idempotency requirements, and credit consumption. https://docs.apollo.io/reference/people-enrichment
- Apollo API docs: Bulk People Enrichment. Up to 10 people per call, lower per-minute throttle, webhook retry/idempotency guidance. https://docs.apollo.io/reference/bulk-people-enrichment
- Apollo docs: Waterfall enrichment overview and final credit calculation after asynchronous webhook completion. https://docs.apollo.io/docs/enrich-phone-and-email-using-data-waterfall
- Apollo API docs: View API Usage Stats and Rate Limits. Endpoint-specific minute, hour, and day limits. https://docs.apollo.io/reference/view-api-usage-stats
- Apollo docs: Convert Enriched People to Contacts, including warning that Apollo does not dedupe automatically in this flow. https://docs.apollo.io/docs/convert-enriched-people-to-contacts
- Apollo API docs: Create a Contact, including `run_dedupe=true` support. https://docs.apollo.io/reference/create-a-contact
- Apollo knowledge base: Email Status Overview. Verified vs unverified vs catch-all semantics and credit behavior. https://knowledge.apollo.io/hc/en-us/articles/4423314404621-Email-Status-Overview
- Apollo knowledge base: Primary email settings and one-credit-per-contact behavior. https://knowledge.apollo.io/hc/en-us/articles/6319289281805-Will-Apollo-Charge-Me-for-More-than-One-Email-per-Contact
- Apollo knowledge base: Personal vs business email behavior and GDPR restriction for EU/UK/CH personal emails. https://knowledge.apollo.io/hc/en-us/articles/6217107598861-Prospect-with-Personal-and-Business-Emails
- Apollo knowledge base: Exporting contacts to CSV does not enrich them automatically. https://knowledge.apollo.io/hc/en-us/articles/4409237712141-Export-Contacts-from-Apollo-to-a-CSV

---
*Pitfalls research for: Apollo API lead search and verified-email export workflow*
*Researched: 2026-03-23*
