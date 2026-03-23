# Phase 4 API Reference: Apollo People Enrichment

**Captured:** 2026-03-24  
**Purpose:** Internal implementation reference for the Apollo enrichment endpoints that Phase 4 is planned around.

This file summarizes the endpoint contracts provided during planning for:
- `POST /api/v1/people/match`
- `POST /api/v1/people/bulk_match`

It is intentionally implementation-focused and does not replace Apollo's official docs.

## Phase 4 Defaults

Unless Phase 4 scope is explicitly expanded, the execution path should assume:
- `run_waterfall_email=false`
- `run_waterfall_phone=false`
- `reveal_personal_emails=false`
- `reveal_phone_number=false`
- no `webhook_url`

Reason:
- Phase 4 is scoped to synchronous native verified-email enrichment only
- waterfall and phone reveal introduce webhook, HTTPS, retry, and idempotency requirements that remain out of scope

## Endpoint Split

### Single Person Enrichment

- Endpoint: `POST https://api.apollo.io/api/v1/people/match`
- Intended use: enrich exactly 1 person
- Best Phase 4 use:
  - single-item remainder after bulk batching
  - targeted retry for one unresolved record

### Bulk People Enrichment

- Endpoint: `POST https://api.apollo.io/api/v1/people/bulk_match`
- Intended use: enrich up to 10 people in one request
- Best Phase 4 use:
  - default batch execution path
  - reviewed people snapshot processing in batches

## Matching Inputs

Apollo is more likely to return a useful match when stronger identifiers are present.

Useful identifiers include:
- Apollo person `id`
- `email`
- `hashed_email`
- `linkedin_url`
- employer `domain`
- `organization_name`
- `first_name` / `last_name`
- `name`

Planning implication:
- a `200` response does not guarantee a useful enrichment result
- weak inputs can still produce a successful HTTP response with no meaningful enriched record

## `people/match` Request Shape

Common fields:
- `first_name`
- `last_name`
- `name`
- `email`
- `hashed_email`
- `organization_name`
- `domain`
- `id`
- `linkedin_url`

Optional credit-expanding fields:
- `reveal_personal_emails`
- `reveal_phone_number`
- `run_waterfall_email`
- `run_waterfall_phone`
- `webhook_url` when phone reveal is enabled

Phase 4 recommendation:
- prefer `id` when available from people search results
- fall back to other strong identifiers only when needed

## `people/match` Response Shape

Top-level object:
- `person`

Relevant fields for Phase 4 quality normalization:
- `person.id`
- `person.first_name`
- `person.last_name`
- `person.name`
- `person.linkedin_url`
- `person.title`
- `person.email_status`
- `person.email`
- `person.organization_id`
- `person.organization`
- `person.employment_history`
- `person.departments`
- `person.subdepartments`
- `person.functions`
- `person.seniority`

Planning implication:
- quality classification should be based on returned `person` data plus `email_status`
- do not treat HTTP success alone as verified-email success

## `people/bulk_match` Request Shape

Top-level request fields:
- `details` (required array)

`details[]` entries can contain:
- `first_name`
- `last_name`
- `name`
- `email`
- `hashed_email`
- `organization_name`
- `domain`
- `id`
- `linkedin_url`

Other query params:
- `run_waterfall_email`
- `run_waterfall_phone`
- `reveal_personal_emails`
- `reveal_phone_number`
- `webhook_url`

Constraints:
- `details[]` supports up to 10 people per request

Planning implication:
- `bulk_match` is the primary Phase 4 execution path
- the executor should batch pending items in groups of up to 10

## `people/bulk_match` Response Shape

Top-level fields:
- `status`
- `error_code`
- `error_message`
- `total_requested_enrichments`
- `unique_enriched_records`
- `missing_records`
- `credits_consumed`
- `matches[]`

`matches[]` objects include fields similar to the single-person `person` object:
- `id`
- `first_name`
- `last_name`
- `name`
- `linkedin_url`
- `title`
- `email_status`
- `email`
- `organization_id`
- `employment_history`
- `organization`
- `account`
- `departments`
- `subdepartments`
- `seniority`
- `functions`
- `revealed_for_current_team`

Planning implications:
- the batch executor should persist response-level counters for actual-vs-estimated reporting
- per-person quality should be normalized from `matches[]`
- `missing_records` must be preserved as a real outcome, not ignored

## Credit and Rate-Limit Notes

General:
- both endpoints consume credits according to the Apollo pricing plan
- reveal and waterfall options can change credit behavior

Important Phase 4 note from planning input:
- `bulk_match` is throttled to 50% of the per-minute rate limit of the single-person enrichment endpoint
- hourly and daily limits remain aligned with the individual endpoint

Planning implication:
- Phase 4 executor must include explicit throttling/backoff logic
- the per-minute constraint matters even though `bulk_match` is the preferred path

## Waterfall and Webhook Notes

When waterfall flags are enabled:
- Apollo returns a synchronous acknowledgement plus enrichment request status
- final waterfall results are delivered asynchronously to a webhook

Webhook requirements mentioned in planning input:
- HTTPS endpoint required
- webhook handler must tolerate rate spikes
- webhook handling must be idempotent because retries may occur

Phase 4 implication:
- keep waterfall off
- do not design Phase 4 around webhook completion

## Implementation Guidance for This Repo

Phase 4 execution should:
- use `bulk_match` as the default batch path
- use `match` only for single-item remainder or retry
- keep all enrichment requests server-side
- persist both:
  - run-level counters from bulk responses
  - per-person normalized outcomes
- treat weak/no-match results as first-class persisted outcomes
- keep reveal/waterfall behavior disabled unless Phase 4 scope changes

## Related Planning Files

- [04-CONTEXT.md](/Users/lian/dev/apollo/.planning/phases/04-retrieval-execution-and-run-safety/04-CONTEXT.md)
- [04-RESEARCH.md](/Users/lian/dev/apollo/.planning/phases/04-retrieval-execution-and-run-safety/04-RESEARCH.md)
- [04-01-PLAN.md](/Users/lian/dev/apollo/.planning/phases/04-retrieval-execution-and-run-safety/04-01-PLAN.md)
- [04-02-PLAN.md](/Users/lian/dev/apollo/.planning/phases/04-retrieval-execution-and-run-safety/04-02-PLAN.md)
- [04-03-PLAN.md](/Users/lian/dev/apollo/.planning/phases/04-retrieval-execution-and-run-safety/04-03-PLAN.md)
