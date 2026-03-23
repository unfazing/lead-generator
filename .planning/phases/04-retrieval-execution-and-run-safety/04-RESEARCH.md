# Phase 4: Retrieval Execution and Run Safety - Research

**Researched:** 2026-03-24
**Domain:** Apollo people enrichment execution, durable file-backed run state, and operator-safe resume flows
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
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

### Claude's Discretion
- Exact naming and placement of run-status badges, as long as active vs interrupted vs completed state is obvious.
- Exact checkpoint granularity and storage shape, provided the operator can safely inspect and resume runs.
- Exact presentation of quality categories, as long as verified business email remains the clearly preferred outcome.

### Deferred Ideas (OUT OF SCOPE)
- Final CSV export shape, configurable export columns, and export dedupe/provenance formatting belong to Phase 5.
- Additional enrichment providers, recurring runs, or broader contact-channel retrieval remain out of scope for this phase.
- Any deployment migration away from file-backed persistence is a separate concern unless Phase 4 planning proves it is a hard blocker.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| COST-04 | User can compare estimated usage with actual usage after a run completes | Persist batch-level request counts, Apollo response counters, and run-level reconciliation derived from run-plan estimate vs completed outcomes |
| COST-05 | User can avoid unnecessary repeat processing through dedupe or reuse checks before enrichment starts | Build a preflight candidate classifier that marks each person as `pending_call`, `reused_success`, `reused_unusable`, or `deduped_within_run` before any Apollo call |
| EMAI-02 | User can monitor retrieval progress and status from the frontend while a run is in progress | Persist run heartbeat, processed counts, batch counts, current status, and latest checkpoint; poll a server-backed run summary view |
| EMAI-03 | User can resume or safely inspect an interrupted retrieval run without losing run state | Store per-contact outcome rows plus cursor/checkpoint state so resume only schedules unresolved contacts |
| EMAI-04 | User can distinguish verified business-email results from non-verified or unusable results | Normalize Apollo `email_status` and related fields into explicit internal quality categories persisted per contact |
</phase_requirements>

## Summary

Phase 4 should be planned as a server-owned execution pipeline layered on top of the existing `run-plans.json` model, not as a client-driven long request. The current codebase persists only a `"draft" | "ready"` run plan in [`src/lib/db/repositories/run-plans.ts`](/Users/lian/dev/apollo/src/lib/db/repositories/run-plans.ts) and rewrites whole JSON collections on every mutation, so the plan must introduce explicit execution records, atomic writes, and checkpoint-based resume before it introduces any UI polish.

Apollo's current docs, checked on 2026-03-24, still define `POST /api/v1/people/match` for 1 person and `POST /api/v1/people/bulk_match` for up to 10 people per call. Bulk enrichment is the standard path for Phase 4 because it matches the reviewed-snapshot workflow and returns request-level counters such as requested enrichments, unique enrichments, missing records, and credits consumed in the tutorial examples. Waterfall enrichment exists, but it switches the system into webhook-driven asynchronous completion with explicit HTTPS and idempotency requirements, so it should remain out of scope unless Phase 4 is intentionally expanded.

The current People Enrichment reference also sharpens the contract details the executor should plan around:
- `POST https://api.apollo.io/api/v1/people/match` is the synchronous single-person enrichment path and is appropriate only for one contact at a time, final single-item remainder, or targeted retry.
- Apollo matches more reliably when the request includes stronger identifiers such as Apollo `id`, `email`, `hashed_email`, `linkedin_url`, or employer `domain`; weak inputs like a bare name can still return `200` with no enriched record.
- The base synchronous response centers on a `person` object with fields such as `id`, `name`, `title`, `email_status`, `email`, `organization_id`, `organization`, `contact`, and `employment_history`, which gives Phase 4 enough signal to normalize verified vs unusable outcomes without waiting on export work.
- `reveal_personal_emails` and `reveal_phone_number` are explicitly opt-in and potentially credit-bearing. They should remain `false` for the initial verified-business-email execution path unless Phase 4 scope is reopened.
- `run_waterfall_email` and `run_waterfall_phone` materially change the delivery model: Apollo responds synchronously with demographic/firmographic data plus waterfall request status, then delivers final enrichment asynchronously to a webhook. That is why Phase 4 should keep those flags `false` and stay on the native synchronous path.
- `webhook_url` becomes mandatory when `reveal_phone_number=true`, and Apollo documents HTTPS, rate-limit tolerance, and idempotent webhook handling as hard requirements. Those requirements are out of scope for the current phase and should remain deferred with waterfall/phone-reveal behavior.

For planning purposes, this means the first implementation wave should explicitly:
- prefer synchronous native enrichment only
- keep `run_waterfall_email=false`, `run_waterfall_phone=false`, `reveal_personal_emails=false`, and `reveal_phone_number=false`
- treat `people/match` as a narrow fallback path, not the primary batch executor
- normalize `person.email_status` plus related returned fields into Phase 4 quality categories rather than assuming every `200` means a successful verified-email enrichment

**Primary recommendation:** Use a bulk-first server executor with persisted per-contact outcomes, batch-boundary checkpoints, and a preflight reuse classifier; reserve single `match` calls for single-item remainder or targeted retry only.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 15.5.2 | Server-rendered workflow UI, server actions, polling endpoints | Already established in the app and aligns with the server-owned execution boundary |
| React | 19.1.1 | Dense inline operator UI | Existing UI stack; sufficient for compact run monitoring without new framework cost |
| TypeScript | 5.9.2 | Typed run records, outcome classification, resume logic | Critical for keeping repository, Apollo payload, and UI state aligned |
| Zod | 4.1.5 | Runtime validation for all new persisted run and outcome records | The current JSON repositories trust disk too much; Phase 4 should tighten this |
| Node `fs/promises` + `path` | Node built-ins | Atomic temp-write/rename persistence and checkpoint files | Avoids introducing an unnecessary queue/database for this phase while fixing durability gaps |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Apollo People Enrichment API | current docs checked 2026-03-24 | `people/match` for 1 contact | Single-item final batch or narrow retry path |
| Apollo Bulk People Enrichment API | current docs checked 2026-03-24 | `people/bulk_match` for up to 10 contacts | Default execution path for reviewed run batches |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| File-backed JSON with atomic writes | Postgres/queue migration | Better durability, but explicitly deferred unless planning proves JSON is a hard blocker |
| Bulk-first `bulk_match` | Single `match` for every contact | Simpler request shape, but worse throughput and weaker batch accounting |
| Polling server-backed run summary | WebSocket/SSE live stream | Richer live updates, but unnecessary for a single-user v1 operator surface |

**Installation:**
```bash
# No new package is required for the recommended v1 path.
# Reuse the existing Next.js/React/TypeScript/Zod stack.
```

**Version verification:** Verified locally in [`package.json`](/Users/lian/dev/apollo/package.json) for Next.js 15.5.2, React 19.1.1, TypeScript 5.9.2, and Zod 4.1.5. Apollo endpoint behavior was verified against official docs on 2026-03-24.

## Architecture Patterns

### Recommended Project Structure
```text
src/
├── app/
│   ├── recipes/actions.ts                  # kickoff/resume/inspect actions, or split by domain
│   └── api/retrieval-runs/[runId]/route.ts # polling JSON endpoint for live status
├── features/
│   └── retrieval-runs/
│       ├── components/                     # run status cards, progress table, resume CTA
│       └── lib/                            # view-model formatters and quality labels
├── lib/
│   ├── apollo/
│   │   └── people-enrichment.ts            # explicit match / bulk_match service
│   ├── retrieval/
│   │   ├── execution.ts                    # batch loop and checkpoint rules
│   │   ├── preflight.ts                    # dedupe / reuse classifier
│   │   └── quality.ts                      # Apollo result normalization
│   └── db/repositories/
│       ├── retrieval-runs.ts               # run header + status + counters
│       ├── retrieval-run-items.ts          # per-contact candidate/outcome records
│       └── file-storage.ts                 # shared atomic read/write helpers
```

### Pattern 1: Run Header + Run Items Split
**What:** Persist a lightweight run header separately from per-contact item records.
**When to use:** Always for Phase 4; the current single `run-plans.json` record is too small to represent execution safely.
**Example:**
```typescript
type RetrievalRunStatus =
  | "ready"
  | "running"
  | "interrupted"
  | "completed"
  | "failed";

type RetrievalRunRecord = {
  id: string;
  runPlanId: string;
  peopleSnapshotId: string;
  status: RetrievalRunStatus;
  totalCandidates: number;
  pendingCount: number;
  processedCount: number;
  successCount: number;
  unusableCount: number;
  reusedCount: number;
  batchSize: number;
  lastCheckpointAt: string | null;
  lastHeartbeatAt: string | null;
  estimatedContacts: number;
  actualCreditsConsumed: number | null;
  createdAt: string;
  updatedAt: string;
};
```

### Pattern 2: Preflight Classification Before Provider Calls
**What:** Turn snapshot rows into run items and classify them before any Apollo request.
**When to use:** Before starting or resuming a run.
**Example:**
```typescript
type PreflightDisposition =
  | "pending_call"
  | "deduped_within_run"
  | "reused_verified"
  | "reused_unusable";

type RetrievalRunItemRecord = {
  id: string;
  runId: string;
  personApolloId: string;
  fullName: string;
  companyName: string;
  disposition: PreflightDisposition;
  executionStatus: "pending" | "processing" | "completed" | "failed";
  outcomeQuality:
    | "verified_business_email"
    | "unverified_email"
    | "email_unavailable"
    | "no_match"
    | "provider_error"
    | null;
  reusedFromRunId: string | null;
  providerPayload: Record<string, unknown> | null;
  providerCreditsConsumed: number | null;
  processedAt: string | null;
};
```

### Pattern 3: Batch-Boundary Checkpointing
**What:** Persist after every Apollo batch, not only at final completion.
**When to use:** Every `bulk_match` request and every single `match` fallback.
**Example:**
```typescript
for (let index = 0; index < pendingItems.length; index += 10) {
  const batch = pendingItems.slice(index, index + 10);
  markBatchProcessing(runId, batch.ids);
  const response = await enrichPeopleBatch(batch);
  persistBatchOutcome(runId, batch, response);
  updateRunCheckpoint(runId, {
    lastCheckpointAt: new Date().toISOString(),
    processedCountDelta: batch.length,
  });
}
```

### Pattern 4: Heartbeat-Based Interruption Detection
**What:** Treat a run as interrupted when persisted status says `"running"` but the heartbeat is stale.
**When to use:** On page load, run-inspection fetches, and resume entry.
**Example:**
```typescript
const INTERRUPT_AFTER_MS = 60_000;

function deriveVisibleStatus(run: RetrievalRunRecord, now = Date.now()) {
  if (
    run.status === "running" &&
    run.lastHeartbeatAt &&
    now - Date.parse(run.lastHeartbeatAt) > INTERRUPT_AFTER_MS
  ) {
    return "interrupted";
  }

  return run.status;
}
```

### Anti-Patterns to Avoid
- **Long-running server action as the whole executor:** Next server actions are the wrong place for a multi-batch durable run. Use them only to create/resume work, then return quickly.
- **Only storing aggregate counters:** Resume safety requires per-contact persisted outcomes, not just `processedCount`.
- **Trusting client state for progress:** The current architecture is server-backed; keep run truth on disk and let the UI poll.
- **Overwriting a single run-plan record with execution details:** Keep planning and execution distinct so estimates remain auditable.
- **Using Apollo waterfall enrichment in this phase by accident:** Waterfall changes the delivery model to webhook-driven async completion.
- **Treating a `200` single-match response as guaranteed success:** Apollo documents that weak identifiers can still yield `200` with no actual enriched record, so the executor must inspect returned `person` data and status fields instead of trusting the HTTP code alone.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Verified-email outcome semantics | Ad hoc UI labels directly from raw Apollo payloads | Central `quality.ts` classifier with internal categories | Export and rerun logic need stable categories later |
| Resume cursor logic | "Start from last index" only | Recompute pending items from persisted per-contact statuses | Index-based cursors double-process after partial batch failures |
| Usage reconciliation | Derived guess from `processedCount` alone | Persist Apollo batch counters plus run-level rollup | Apollo can return success, missing, and credit counts that differ from naive processed totals |
| File durability | Plain `writeFile()` to the only JSON file | Temp file + rename + schema-validated read | The current repository pattern risks corruption and lost progress |
| Dedupe | In-memory `Set` only | Persisted reuse records keyed by person Apollo ID and run context | Resume and future export phases need provenance, not hidden skips |

**Key insight:** The deceptively hard part is not the Apollo HTTP call. It is making every contact's enrichment decision durable, inspectable, and reusable after interruption.

## Common Pitfalls

### Pitfall 1: Planning for a single run record only
**What goes wrong:** The plan stores counts but not which contacts were processed.
**Why it happens:** The existing `run-plans.ts` model only tracks estimate and readiness.
**How to avoid:** Introduce separate run-item persistence before implementing execution.
**Warning signs:** You cannot answer "which contacts are safe to resume?" from disk alone.

### Pitfall 2: Using batch position as the resume cursor
**What goes wrong:** A crash between provider response and file write causes duplicate processing on resume.
**Why it happens:** File-backed systems do not give transactional batch commit semantics for free.
**How to avoid:** Mark items `processing`, then persist terminal item outcomes and only then advance checkpoint counters.
**Warning signs:** Resume logic says "restart batch N" rather than "select unresolved items."

### Pitfall 3: Mixing plan estimate and actual run truth
**What goes wrong:** The operator loses confidence because the original estimate disappears once execution starts.
**Why it happens:** Reusing the same fields for planned and actual values.
**How to avoid:** Keep `runPlan.estimatedContacts` immutable and write actual usage into a new retrieval-run record.
**Warning signs:** The UI can no longer display the saved pre-run estimate once execution begins.

### Pitfall 4: Treating `email_status` as the only quality signal
**What goes wrong:** The app misclassifies no-match or unusable responses as mere unverified rows.
**Why it happens:** Apollo responses include both request-level counters and person-level fields.
**How to avoid:** Classify using request counters plus row-level fields like `email`, `email_status`, and match presence.
**Warning signs:** Every non-verified outcome is collapsed into a single bucket.

### Pitfall 5: Accidentally relying on waterfall behavior
**What goes wrong:** Planning assumes synchronous completion while Apollo delivers final results asynchronously to a webhook.
**Why it happens:** `run_waterfall_email` is a small flag with large architectural consequences.
**How to avoid:** Explicitly keep waterfall flags false in Phase 4 unless the scope is reopened.
**Warning signs:** The plan mentions webhook receivers, public HTTPS callbacks, or delayed final credits without a corresponding scope change.

### Pitfall 6: Treating Apollo auth docs as mechanically complete
**What goes wrong:** Implementation uses the wrong auth header for the account behavior actually seen in this app.
**Why it happens:** Apollo reference pages show Bearer auth, while this codebase already observed working `X-Api-Key` behavior in live usage telemetry.
**How to avoid:** Re-verify enrichment auth/header behavior against the same account before shipping the execution service.
**Warning signs:** Usage endpoint works while enrichment endpoints fail with auth errors despite a valid API key.

## Code Examples

Verified patterns from official and local sources:

### Apollo bulk enrichment request shape
```typescript
// Source: https://docs.apollo.io/docs/enrich-people-data
const response = await fetch("https://api.apollo.io/api/v1/people/bulk_match", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Cache-Control": "no-cache",
    "X-Api-Key": env.APOLLO_API_KEY,
  },
  body: JSON.stringify({
    details: batch.map((item) => ({ id: item.personApolloId })),
  }),
  cache: "no-store",
});
```

### Server-backed polling view
```typescript
// Source: local architecture pattern in src/app/search/page.tsx and repositories/*
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ runId: string }> },
) {
  const { runId } = await params;
  const run = await getRetrievalRunById(runId);

  if (!run) {
    return Response.json({ error: "Run not found" }, { status: 404 });
  }

  return Response.json({
    run,
    visibleStatus: deriveVisibleStatus(run),
    counts: summarizeRunCounts(run),
  });
}
```

### Apollo single-person enrichment request shape
```ts
const response = await fetch("https://api.apollo.io/api/v1/people/match", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
    "X-Api-Key": env.APOLLO_API_KEY,
  },
  body: JSON.stringify({
    id: personApolloId,
    run_waterfall_email: false,
    run_waterfall_phone: false,
    reveal_personal_emails: false,
    reveal_phone_number: false,
  }),
});
```

### Apollo single-person response implications
- A successful native response includes a top-level `person` object rather than only aggregate counters.
- Relevant Phase 4 fields include `person.id`, `person.name`, `person.title`, `person.email_status`, `person.email`, `person.organization_id`, `person.organization`, and `person.employment_history`.
- Quality classification should be based on returned content and `email_status`, not just whether the endpoint returned `200`.
- Phone reveal and waterfall behavior should remain disabled in the first execution path because they introduce webhook-only follow-up payloads and different credit semantics.

### Atomic file write helper
```typescript
import { rename, writeFile } from "node:fs/promises";
import path from "node:path";

export async function writeJsonAtomically(filePath: string, value: unknown) {
  const tempPath = path.join(
    path.dirname(filePath),
    `${path.basename(filePath)}.tmp`,
  );

  await writeFile(tempPath, JSON.stringify(value, null, 2), "utf8");
  await rename(tempPath, filePath);
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Client remembers long-running progress | Server-backed polling over persisted run state | Stable web-app pattern; already used locally for search workflow state | Better reload/restart safety |
| Generic "job succeeded/failed" status | Per-item outcome persistence plus resume from unresolved items | Mature background-workflow practice | Prevents accidental double-processing |
| Blind enrichment retries | Preflight reuse and dedupe before paid calls | Common credit-preservation pattern | Cuts spend and keeps provenance |
| Waterfall-by-default enrichment thinking | Explicitly separate synchronous native enrichment from webhook-driven waterfall | Apollo docs checked 2026-03-24 | Avoids accidental webhook scope creep |

**Deprecated/outdated:**
- Implicit "later retrieval phase" placeholder notes from Phase 3: Phase 4 now needs concrete execution records and persistence, not just plan status.

## Open Questions

1. **Should resume auto-continue or require explicit operator confirmation every time?**
   - What we know: Context locks explicit operator action and resume visibility.
   - What's unclear: Whether clicking "Resume run" should immediately continue or first show remaining/reused/failed counts.
   - Recommendation: Plan a dedicated resume confirmation step with the remaining-work summary shown server-side.

2. **Should actual credit reporting trust Apollo response counters or only the usage-stats endpoint?**
   - What we know: Apollo tutorial examples show per-request counters including `credits_consumed`; the usage-stats endpoint gives account-level rate-limit/usage data.
   - What's unclear: Whether every non-waterfall response reliably returns enough counters for final reconciliation in this account tier.
   - Recommendation: Use run-local response counters as primary actual usage, then optionally compare to usage-stats telemetry as a secondary operator cross-check.

3. **Does Phase 4 need single-run exclusivity across browser tabs?**
   - What we know: The product is single-user, but the file-backed repository model is vulnerable to concurrent writes.
   - What's unclear: Whether the planner should include a lock-file or "active run exists" guard in the first implementation wave.
   - Recommendation: Yes. Plan an explicit single-active-run guard plus persisted lock/lease metadata; confidence HIGH because current JSON writes are non-transactional.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | none detected |
| Config file | none - see Wave 0 |
| Quick run command | `npm run typecheck` |
| Full suite command | `npm run lint && npm run typecheck` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| COST-04 | Estimated vs actual usage reconciliation is correct | unit | `npm run typecheck` | ❌ Wave 0 |
| COST-05 | Preflight reuse/dedupe suppresses unnecessary Apollo calls | unit | `npm run typecheck` | ❌ Wave 0 |
| EMAI-02 | Active run status and progress render from persisted state | integration | `npm run typecheck` | ❌ Wave 0 |
| EMAI-03 | Interrupted run can be inspected and resumed without double-processing | integration | `npm run typecheck` | ❌ Wave 0 |
| EMAI-04 | Apollo outcomes map to verified vs unusable categories correctly | unit | `npm run typecheck` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm run typecheck`
- **Per wave merge:** `npm run lint && npm run typecheck`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] Add a real test runner such as Vitest for repository, classifier, and execution-loop tests
- [ ] Add repository fixture helpers for malformed JSON, interrupted batches, and atomic-write verification
- [ ] Add Apollo enrichment fixture payloads for verified, unverified, missing, and mixed bulk responses
- [ ] Add run-resume integration coverage around the new retrieval repositories and polling endpoint

## Sources

### Primary (HIGH confidence)
- Official Phase 4 context: [.planning/phases/04-retrieval-execution-and-run-safety/04-CONTEXT.md](/Users/lian/dev/apollo/.planning/phases/04-retrieval-execution-and-run-safety/04-CONTEXT.md) - locked decisions, discretion, and scope
- Official requirements: [.planning/REQUIREMENTS.md](/Users/lian/dev/apollo/.planning/REQUIREMENTS.md) - requirement text for COST-04, COST-05, EMAI-02, EMAI-03, EMAI-04
- Official roadmap: [.planning/ROADMAP.md](/Users/lian/dev/apollo/.planning/ROADMAP.md) - Phase 4 plans and success criteria
- Official codebase docs: [.planning/codebase/ARCHITECTURE.md](/Users/lian/dev/apollo/.planning/codebase/ARCHITECTURE.md), [.planning/codebase/STACK.md](/Users/lian/dev/apollo/.planning/codebase/STACK.md), [.planning/codebase/CONCERNS.md](/Users/lian/dev/apollo/.planning/codebase/CONCERNS.md)
- Local implementation: [`src/lib/db/repositories/run-plans.ts`](/Users/lian/dev/apollo/src/lib/db/repositories/run-plans.ts), [`src/lib/db/repositories/people-snapshots.ts`](/Users/lian/dev/apollo/src/lib/db/repositories/people-snapshots.ts), [`src/app/recipes/actions.ts`](/Users/lian/dev/apollo/src/app/recipes/actions.ts), [`src/features/usage/lib/apollo-usage.ts`](/Users/lian/dev/apollo/src/features/usage/lib/apollo-usage.ts)
- Apollo People Enrichment docs - https://docs.apollo.io/reference/people-enrichment
- Apollo Bulk People Enrichment docs - https://docs.apollo.io/reference/bulk-people-enrichment
- Apollo enrichment tutorial - https://docs.apollo.io/docs/enrich-people-data
- Apollo usage stats docs - https://docs.apollo.io/reference/view-api-usage-stats

### Secondary (MEDIUM confidence)
- Apollo waterfall enrichment tutorial - https://docs.apollo.io/docs/enrich-phone-and-email-using-data-waterfall

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - mostly existing local stack plus official Apollo endpoint docs
- Architecture: HIGH - directly grounded in current repository/action structure and file-backed persistence constraints
- Pitfalls: HIGH - confirmed by current codebase concerns and Apollo's documented webhook/asynchronous behavior

**Research date:** 2026-03-24
**Valid until:** 2026-04-23
