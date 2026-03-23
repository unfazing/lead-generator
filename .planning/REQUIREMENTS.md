# Requirements: Apollo Lead Finder

**Defined:** 2026-03-23
**Core Value:** Turn precise Apollo filters into verified-email exports quickly without wasting API credits.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Recipes

- [x] **RECP-01**: User can create a saved recipe with Apollo company-search filters
- [x] **RECP-02**: User can add person-search filters to a saved recipe
- [x] **RECP-03**: User can save output column selections and CSV export settings as part of a recipe
- [ ] **RECP-04**: User can load an existing recipe and rerun it without re-entering filters

### Company Search

- [x] **COMP-01**: User can submit Apollo company-search filters from the frontend
- [x] **COMP-02**: User can view matched companies in a paginated preview table before moving to people search
- [x] **COMP-03**: User can persist company-search results as a local snapshot for later planning and reruns
- [x] **COMP-04**: User can see when a company search may be too broad and requires refinement before continuing

### People Search

- [x] **PEOP-01**: User can run people search against manually selected companies from a company result set
- [x] **PEOP-02**: User can run people search against all companies in a qualified company result set
- [x] **PEOP-03**: User can preview matched people before retrieving verified emails
- [x] **PEOP-04**: User can persist people-search results as a local snapshot tied to the source company selection

### Credit Controls

- [x] **COST-01**: User can see current Apollo API or credit usage data in the frontend
- [x] **COST-02**: User can see an estimated credit cost before starting verified-email retrieval
- [x] **COST-03**: User can configure run limits or stop conditions that cap how many contacts are processed
- [ ] **COST-04**: User can compare estimated usage with actual usage after a run completes
- [ ] **COST-05**: User can avoid unnecessary repeat processing through dedupe or reuse checks before enrichment starts

### Email Retrieval

- [x] **EMAI-01**: User can start verified-email retrieval only from a reviewed people result set
- [ ] **EMAI-02**: User can monitor retrieval progress and status from the frontend while a run is in progress
- [ ] **EMAI-03**: User can resume or safely inspect an interrupted retrieval run without losing run state
- [ ] **EMAI-04**: User can distinguish verified business-email results from non-verified or unusable results

### Export

- [ ] **EXPT-01**: User can export verified-email results to CSV
- [ ] **EXPT-02**: User can export only the configured output columns saved in the active recipe or run setup
- [ ] **EXPT-03**: User can exclude duplicate contacts from an export
- [ ] **EXPT-04**: User can trace exported rows back to their source company, source run, and verification status

## v2 Requirements

### Integrations and Expansion

- **NEXT-01**: User can push enriched contacts to an external CRM
- **NEXT-02**: User can schedule recurring recipe runs
- **NEXT-03**: User can retrieve contact channels beyond verified business email
- **NEXT-04**: User can use secondary enrichment providers when Apollo coverage is insufficient

### Collaboration

- **COLL-01**: Multiple users can sign in and use separate workspaces
- **COLL-02**: User can manage roles, permissions, or admin settings

## Out of Scope

| Feature | Reason |
|---------|--------|
| Multi-user accounts | Personal tool only for v1 |
| Outreach sequencing or email automation | Not part of the search-to-verified-email export workflow |
| Phone-number or personal-email enrichment | Verified business email is the only required contact channel in v1 |
| Browser-only Apollo access | Apollo credentials, credit controls, and execution state must stay server-side |
| Automatic recurring runs | Adds credit-risk and scheduling complexity before the core workflow is proven |
| Multi-provider waterfall enrichment | Broadens spend and behavior complexity before Apollo-only workflow is validated |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| RECP-01 | Phase 1 | Complete |
| RECP-02 | Phase 1 | Complete |
| RECP-03 | Phase 1 | Complete |
| RECP-04 | Phase 5 | Pending |
| COMP-01 | Phase 2 | Complete |
| COMP-02 | Phase 2 | Complete |
| COMP-03 | Phase 2 | Complete |
| COMP-04 | Phase 2 | Complete |
| PEOP-01 | Phase 3 | Complete |
| PEOP-02 | Phase 3 | Complete |
| PEOP-03 | Phase 3 | Complete |
| PEOP-04 | Phase 3 | Complete |
| COST-01 | Phase 1 | Complete |
| COST-02 | Phase 3 | Complete |
| COST-03 | Phase 3 | Complete |
| COST-04 | Phase 4 | Pending |
| COST-05 | Phase 4 | Pending |
| EMAI-01 | Phase 3 | Complete |
| EMAI-02 | Phase 4 | Pending |
| EMAI-03 | Phase 4 | Pending |
| EMAI-04 | Phase 4 | Pending |
| EXPT-01 | Phase 5 | Pending |
| EXPT-02 | Phase 5 | Pending |
| EXPT-03 | Phase 5 | Pending |
| EXPT-04 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 25 total
- Mapped to phases: 25
- Unmapped: 0

---
*Requirements defined: 2026-03-23*
*Last updated: 2026-03-23 after Phase 3 execution*
