---
phase: 04
slug: retrieval-execution-and-run-safety
status: approved
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-24
---

# Phase 04 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | none — Wave 0 installs |
| **Quick run command** | `npm run test -- retrieval` |
| **Full suite command** | `npm run test` |
| **Estimated runtime** | ~20 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test -- retrieval`
- **After every plan wave:** Run `npm run test`
- **Before `$gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 20 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | EMAI-02 | unit | `npm run test -- retrieval-runs` | ❌ W0 | ⬜ pending |
| 04-01-02 | 01 | 1 | EMAI-02 | unit/integration | `npm run test -- people-enrichment execution` | ❌ W0 | ⬜ pending |
| 04-01-03 | 01 | 1 | EMAI-02 | component | `npm run test -- retrieval-run-status-card` | ❌ W0 | ⬜ pending |
| 04-02-01 | 02 | 2 | EMAI-03 | unit/integration | `npm run test -- retrieval-resume run-summary` | ❌ W0 | ⬜ pending |
| 04-02-02 | 02 | 2 | COST-04 | integration | `npm run test -- retrieval-usage-summary` | ❌ W0 | ⬜ pending |
| 04-03-01 | 03 | 3 | COST-05 | unit | `npm run test -- retrieval-preflight` | ❌ W0 | ⬜ pending |
| 04-03-02 | 03 | 3 | EMAI-04 | unit/component | `npm run test -- retrieval-quality retrieval-results-table` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `vitest` + config + `npm run test` script — install and configure framework
- [ ] `tests/retrieval-runs.repository.test.ts` — durable retrieval-run repository coverage
- [ ] `tests/people-enrichment.execution.test.ts` — bulk-first batching, throttling, and checkpoint execution coverage
- [ ] `tests/retrieval-resume.test.ts` — interrupted-run detection and unresolved-item resume coverage
- [ ] `tests/retrieval-preflight.test.ts` — dedupe/reuse classification coverage
- [ ] `tests/retrieval-quality.test.ts` — Apollo outcome normalization coverage

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Polling run status feels understandable in the inline search workflow | EMAI-02 | Final UX density and operator clarity still need human judgment | Start a run from a reviewed people snapshot, reload `/search`, and confirm that status, counts, and current state remain legible without opening a separate admin page |
| Resume confirmation communicates prior progress before continuing | EMAI-03 | Messaging clarity is workflow-specific and not fully captured by unit tests | Simulate an interrupted run, reopen the workspace, and verify that resume CTA shows processed vs remaining work before the operator resumes |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 20s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-03-24
