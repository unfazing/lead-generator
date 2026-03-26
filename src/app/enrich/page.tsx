import Link from "next/link";
import { WorkspaceEmptyState } from "@/features/search-workspace/components/workspace-empty-state";
import {
  listContactBatches,
  type ContactBatchRecord,
} from "@/lib/db/repositories/contact-batches";
import { listContactBatchMembersWithCoverage } from "@/lib/db/repositories/contact-batch-members";

type BatchSummary = {
  batch: ContactBatchRecord;
  totalMembers: number;
  alreadyEnrichedMembers: number;
  lastAddedFromSnapshot: string | null;
};

async function buildBatchSummary(batch: ContactBatchRecord): Promise<BatchSummary> {
  const members = await listContactBatchMembersWithCoverage(batch.id);

  return {
    batch,
    totalMembers: members.length,
    alreadyEnrichedMembers: members.filter((member) => member.alreadyEnriched).length,
    lastAddedFromSnapshot:
      members
        .flatMap((member) => member.provenance.map((entry) => entry.peopleSnapshotId))
        .at(-1) ?? null,
  };
}

export default async function EnrichPage() {
  const batches = await listContactBatches();
  const summaries = await Promise.all(batches.map(buildBatchSummary));
  const activeBatch = summaries[0] ?? null;

  return (
    <main className="shell workspace-shell">
      <section className="workspace-panel search-hero">
        <div className="workspace-header">
          <p className="eyebrow">Enrichment workflow</p>
          <h1>Work from contact batches instead of people snapshots.</h1>
          <p>Contact batches are mutable saved groupings keyed by Apollo person ID. They can accumulate members from multiple people snapshots while the global enriched-people store stays append-only.</p>
          <div className="workspace-actions">
            <Link className="secondary-button" href="/search/people">
              Browse people snapshots
            </Link>
            <Link className="secondary-button" href="/enrich/store">
              Open enriched-people store
            </Link>
          </div>
        </div>
      </section>
      {summaries.length === 0 ? (
        <WorkspaceEmptyState
          eyebrow="Enrichment workflow"
          title="No contact batches created yet."
          description="Phase 04.1 establishes the batch and store foundations first. Use saved people snapshots as future add sources, then manage enrichment from this route."
          primaryAction={{ href: "/search/people", label: "Open people workflow" }}
          secondaryAction={{ href: "/enrich/store", label: "View enriched-people store" }}
        />
      ) : (
        <div className="workspace-grid workspace-grid-wide search-grid">
          <section className="card stack search-sidebar">
            <div className="workspace-header">
              <p className="eyebrow">Contact batches</p>
              <h2>Saved enrichment worksets</h2>
              <p>Each batch dedupes by Apollo person ID and preserves all contributing snapshot provenance.</p>
            </div>
            <div className="stack">
              {summaries.map((summary) => (
                <article key={summary.batch.id} className="card stack">
                  <div className="workspace-header">
                    <h3>{summary.batch.name}</h3>
                    <p>{summary.batch.notes || "No notes yet."}</p>
                  </div>
                  <div className="stats-grid">
                    <div className="stat-tile">
                      <span className="meta">Members</span>
                      <strong>{summary.totalMembers}</strong>
                    </div>
                    <div className="stat-tile">
                      <span className="meta">Already in global store</span>
                      <strong>{summary.alreadyEnrichedMembers}</strong>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
          <section className="card stack search-main">
            <div className="workspace-header">
              <p className="eyebrow">Current foundation</p>
              <h2>{activeBatch?.batch.name ?? "Contact batch overview"}</h2>
              <p>This route is now the durable home for enrichment. Later plans can layer add-from-snapshot controls, member removal, run execution, and batch-scoped result views on top of this persisted model.</p>
            </div>
            {activeBatch ? (
              <>
                <div className="stats-grid">
                  <div className="stat-tile">
                    <span className="meta">Unique members</span>
                    <strong>{activeBatch.totalMembers}</strong>
                  </div>
                  <div className="stat-tile">
                    <span className="meta">Skipped by global store</span>
                    <strong>{activeBatch.alreadyEnrichedMembers}</strong>
                  </div>
                  <div className="stat-tile">
                    <span className="meta">Latest source snapshot</span>
                    <strong>{activeBatch.lastAddedFromSnapshot ?? "None yet"}</strong>
                  </div>
                </div>
                <div className="empty-message">
                  Enrichment execution remains server-enforced: any Apollo person ID already present in the global enriched-people store is skipped before Apollo calls, regardless of which batch later references it.
                </div>
              </>
            ) : null}
          </section>
        </div>
      )}
    </main>
  );
}
