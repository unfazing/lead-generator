# Feature Research

**Domain:** Apollo API-powered prospecting workflow tool for company-to-contact verified-email export
**Researched:** 2026-03-23
**Confidence:** HIGH

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Company search with Apollo filters | Apollo’s core prospecting flow starts with account/company filtering, and the project’s workflow begins there. | MEDIUM | Must support Apollo company search inputs, pagination limits, and narrowing before downstream actions because organization search consumes credits. |
| People search from matched companies | Users expect to move from target accounts to target contacts without manual re-entry. | MEDIUM | Must support both “selected companies only” and “all matched companies” modes from `PROJECT.md`. Apollo people search itself is non-credit, so this is the safe preview stage. |
| Verified-email-only contact retrieval | The whole product promise is “filters to verified-email CSV”; without verified-email gating the output is low trust. | MEDIUM | Must only surface contacts with verified business emails for default runs. Enrichment is the credit-spending step, so keep it explicit. |
| CSV export with configurable columns | Every comparable tool ends in CSV or CRM export; for this app, CSV is the primary output. | LOW | Export should preserve chosen output schema and avoid charging logic at export time by only exporting already-enriched rows. |
| Credit visibility and pre-run estimates | Credit transparency is a first-order expectation in Apollo/Hunter-style prospecting because reveal/enrichment costs are the main operational constraint. | MEDIUM | Show expected search/enrichment counts before execution and actual usage after execution. This is table stakes for this project even if many tools hide it behind billing UIs. |
| Saved recipes for repeatable runs | Prospecting users expect saved searches/lists/templates; repeated filter setup is wasted effort. | MEDIUM | Recipes should save company filters, person filters, verified-email requirement, and export column configuration. |
| Result preview and selective execution | Users expect to inspect targets before spending credits. Hunter and Apollo both separate preview from reveal/export. | MEDIUM | Preview companies and people counts before enrichment; allow deselecting weak-fit companies or titles before credit spend. |
| Duplicate suppression in exports | Exported lead lists are expected to be usable immediately; duplicates make the tool feel unreliable. | LOW | Deduplicate by Apollo person/contact identifier plus normalized email/domain before CSV generation. |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Cost-aware run planner | The strongest project-specific differentiator is telling the user what a run is likely to cost before it happens. | MEDIUM | Convert company count, per-company people caps, and verified-email filters into projected enrichment spend ranges. Prioritize “safe to run” over maximizing volume. |
| Two-stage execution with dry-run previews | Separating discover/search from enrich/export preserves credits and creates confidence. | MEDIUM | Stage 1: company + people discovery. Stage 2: enrich only the selected/final subset. This is more opinionated and efficient than generic bulk-run UX. |
| Recipe-based output presets | Fast repeatability matters more than broad collaboration in a single-user internal tool. | LOW | Bundle filters plus export schema, row caps, and enrichment rules into reusable named workflows. |
| Credit-preserving guardrails | Most tools let users overspend accidentally; guardrails are a real UX advantage for an Apollo basic-plan workflow. | MEDIUM | Examples: hard run caps, “stop after N verified emails,” “skip companies over X contacts,” and warnings when filter breadth implies waste. |
| Manual company shortlist mode | Gives tighter control for high-value runs where the user wants to hand-pick accounts before contact enrichment. | LOW | This aligns directly with the project’s “manual-select and all-company modes” requirement. |
| Export-quality scoring or reason codes | Helps the user trust why a row made it into the final CSV and prune weak rows fast. | MEDIUM | Lightweight scoring should stay rule-based: title match, verification status, company-fit match, duplicate risk. Avoid AI-first scoring in v1. |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Built-in outbound sequencing / email sending | Feels like the natural “next step” after export. | Turns a focused prospecting utility into a sales-engagement product with deliverability, compliance, unsubscribe, and analytics scope. | Export clean CSVs for use in dedicated outreach tools. |
| Multi-provider waterfall enrichment in v1 | Seems attractive for maximizing coverage like Clay. | Adds vendor sprawl, credit complexity, async orchestration, and data consistency issues; it conflicts with the project’s Apollo-first efficiency goal. | Stay Apollo-native first; add explicit provider fallback later only if Apollo coverage is insufficient. |
| Team workspaces, roles, approvals, shared ownership | Common SaaS expectation. | Adds auth, tenancy, permissions, audit scope, and collaboration UX that the single-user internal app does not need. | Single-user local/shared-secret setup with clear run history. |
| Phone numbers, personal emails, and multichannel enrichment | Users often ask for “everything available” per contact. | Expands spend and policy complexity while weakening the product’s verified-business-email focus. | Keep v1 to verified business emails only, with a future toggle if the use case materially changes. |
| Always-on background crawling / auto-refresh of prospect lists | Sounds useful for keeping lists fresh. | Easy way to burn credits invisibly and violate the “one-session completion with visible usage” goal. | Manual reruns and optional scheduled dry-runs only after usage controls exist. |
| AI-written outreach copy as a core feature | Popular in GTM tools and easy to ask for. | Distracts from the real bottleneck here: reliable, cost-efficient lead extraction. Also invites prompt/UI complexity without validating core workflow. | Keep the product focused on producing high-trust export data that can feed a separate messaging system. |

## Feature Dependencies

```text
[Company search with Apollo filters]
    └──requires──> [Result preview and selective execution]
                          └──requires──> [People search from matched companies]
                                                └──requires──> [Verified-email-only contact retrieval]
                                                                      └──requires──> [CSV export with configurable columns]

[Credit visibility and pre-run estimates] ──gates──> [Verified-email-only contact retrieval]
[Credit-preserving guardrails] ──enhances──> [Credit visibility and pre-run estimates]
[Saved recipes for repeatable runs] ──requires──> [Company search with Apollo filters]
[Saved recipes for repeatable runs] ──requires──> [CSV export with configurable columns]
[Manual company shortlist mode] ──enhances──> [Result preview and selective execution]
[Multi-provider waterfall enrichment in v1] ──conflicts──> [Credit-preserving guardrails]
[Built-in outbound sequencing / email sending] ──conflicts──> [Single-user export-first scope]
```

### Dependency Notes

- **Company search requires preview before people enrichment:** Apollo organization search consumes credits, so the workflow needs a review point before compounding cost downstream.
- **People search precedes verified-email retrieval:** Apollo people search is the discovery layer; enrichment/reveal is the paid retrieval layer.
- **CSV export depends on retrieval:** Export is valuable only after the tool has materialized verified emails for the selected contacts.
- **Credit visibility gates retrieval:** The product’s core value is preserving credits, so pre-run estimates are not a reporting extra; they are part of execution control.
- **Recipes depend on both search and export configuration:** Reusability is weak if a saved recipe remembers filters but not the output schema or run constraints.
- **Waterfall enrichment conflicts with credit guardrails in v1:** The more providers involved, the harder it is to give simple, trustworthy spend predictions.

## MVP Definition

### Launch With (v1)

Minimum viable product — what’s needed to validate the concept.

- [ ] Company search with Apollo filters — the workflow starts here and cannot be simulated manually without breaking one-session usability.
- [ ] People search from matched companies — required to convert account targeting into contact discovery.
- [ ] Verified-email-only contact retrieval — core value depends on exporting contacts with verified business emails only.
- [ ] Credit visibility and pre-run estimates — central to the project’s stated success criteria and Apollo basic-plan efficiency goal.
- [ ] Result preview and selective execution — prevents blind enrichment spend.
- [ ] CSV export with configurable columns — primary end-state output for the tool.
- [ ] Saved recipes for repeatable runs — makes the internal app practically reusable rather than a one-off interface.
- [ ] Duplicate suppression in exports — keeps output immediately usable.

### Add After Validation (v1.x)

Features to add once core is working.

- [ ] Credit-preserving guardrails — add once baseline usage telemetry is accurate enough to enforce caps confidently.
- [ ] Manual company shortlist mode improvements — start simple, then add bulk shortlist actions or ranking helpers after the base flow works.
- [ ] Export-quality scoring or reason codes — useful once there is enough real usage to tune rules around “good row” vs “wasteful row.”
- [ ] Run history and recipe rerun comparisons — add after the core execution path is stable and worth analyzing over time.

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] Optional secondary-provider fallback enrichment — only if Apollo-only coverage proves insufficient in practice.
- [ ] CRM push or webhook handoff — valuable after CSV-first workflow is proven and stable.
- [ ] Scheduled reruns with hard budget controls — only after credit estimation and run safety are very reliable.
- [ ] Expanded contact channels beyond verified business email — defer unless the user’s actual workflow changes materially.

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Company search with Apollo filters | HIGH | MEDIUM | P1 |
| People search from matched companies | HIGH | MEDIUM | P1 |
| Verified-email-only contact retrieval | HIGH | MEDIUM | P1 |
| Credit visibility and pre-run estimates | HIGH | MEDIUM | P1 |
| Result preview and selective execution | HIGH | MEDIUM | P1 |
| CSV export with configurable columns | HIGH | LOW | P1 |
| Saved recipes for repeatable runs | HIGH | MEDIUM | P1 |
| Duplicate suppression in exports | MEDIUM | LOW | P1 |
| Credit-preserving guardrails | HIGH | MEDIUM | P2 |
| Manual company shortlist mode | MEDIUM | LOW | P2 |
| Export-quality scoring or reason codes | MEDIUM | MEDIUM | P2 |
| Secondary-provider fallback enrichment | MEDIUM | HIGH | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

## Competitor Feature Analysis

| Feature | Apollo | Hunter | Our Approach |
|---------|--------|--------|--------------|
| Company/account search | Native organization search with filters, credit-bearing | Domain/company search focused on publicly sourced emails | Use Apollo organization search as the account-entry point because it matches the target dataset and person-search handoff. |
| People/contact search | Native people search, non-credit discovery before enrichment | Strong domain-based contact surfacing and department filters | Keep Apollo people search as the preview/discovery stage, then enrich only the chosen subset. |
| Verified email retrieval | Enrichment/reveal step can consume credits; verified email status exposed | Reveal-based model with verification/confidence emphasis | Make retrieval explicit and verified-email-only by default, with cost shown before execution. |
| CSV export | Standard, but exports net-new contacts with credit implications | Standard CSV export after reveal; export itself is effectively free | Export only already-selected, already-enriched rows to keep cost semantics simple. |
| Workflow automation | Broad platform capabilities including sequences and CRM actions | Narrower email finding/export workflow | Stay closer to Hunter’s focused workflow shape, but with Apollo-native company-to-people orchestration and saved recipes. |
| Waterfall / multi-source enrichment | Available through Apollo waterfall flags for enrichment | Not the primary product shape | Do not treat waterfall as v1 scope; optimize for predictable Apollo-only runs first. |

## Sources

- Apollo API docs: People API Search — https://docs.apollo.io/reference/people-api-search
- Apollo API docs: Organization Search — https://docs.apollo.io/reference/organization-search
- Apollo API docs: People Enrichment — https://docs.apollo.io/reference/people-enrichment
- Apollo API docs: Bulk People Enrichment — https://docs.apollo.io/reference/bulk-people-enrichment
- Apollo API docs: View API Usage Stats and Rate Limits — https://docs.apollo.io/reference/view-api-usage-stats
- Apollo help: Export Contacts to a CSV (updated February 3, 2026) — https://knowledge.apollo.io/hc/en-us/articles/4409237712141-Export-Contacts-to-a-CSV
- Apollo help: What Are Credits? (updated March 9, 2026) — https://knowledge.apollo.io/hc/en-us/articles/9527776320781-What-Are-Credits
- Apollo help: Will Apollo Charge Me for More than One Email per Contact? — https://knowledge.apollo.io/hc/en-us/articles/6319289281805-Will-Apollo-Charge-Me-for-More-than-One-Email-per-Contact
- Hunter product/help docs: Bulk Email Finder, Bulk Domain Search, and reveal/export behavior — https://hunter.io/bulks/email-finder , https://hunter.io/bulks/domain-search , https://help.hunter.io/en/articles/1913848-how-to-save-and-export-leads-from-domain-search
- Clay product/docs: Waterfall enrichment and bulk enrichment patterns — https://www.clay.com/waterfall-enrichment , https://university.clay.com/docs/bulk-enrichment

---
*Feature research for: Apollo API-powered prospecting workflow tool*
*Researched: 2026-03-23*
