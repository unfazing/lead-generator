import type { ContactBatchRecord } from "@/lib/db/repositories/contact-batches";
import type { ContactBatchMemberCoverageRecord } from "@/lib/db/repositories/contact-batch-members";
import type { EnrichedPersonRecord } from "@/lib/db/repositories/enriched-people";

type BatchSummary = {
  batch: ContactBatchRecord;
  totalMembers: number;
  alreadyEnrichedMembers: number;
  lastAddedFromSnapshot: string | null;
};

type ContactBatchPanelProps = {
  batch: ContactBatchRecord;
  members: ContactBatchMemberCoverageRecord[];
  summary: BatchSummary;
  enrichedByApolloId: Map<string, EnrichedPersonRecord>;
};

function formatEnrichmentState(
  member: ContactBatchMemberCoverageRecord,
  enriched: EnrichedPersonRecord | undefined,
) {
  if (member.alreadyEnriched && enriched) {
    return `Already handled • ${enriched.quality}`;
  }

  if (member.alreadyEnriched) {
    return "Already handled";
  }

  return "Missing from global store";
}

export function ContactBatchPanel({
  batch,
  members,
  summary,
  enrichedByApolloId,
}: ContactBatchPanelProps) {
  return (
    <section className="card stack">
      <div className="workspace-header">
        <p className="eyebrow">Current batch</p>
        <h2>{batch.name}</h2>
        <p>
          Manage this contact batch as a reusable enrichment workset. Member rows
          show frozen display data from source snapshots plus current coverage from
          the append-only enriched-people store.
        </p>
      </div>
      <div className="stats-grid">
        <div className="stat-tile">
          <span className="meta">Members</span>
          <strong>{summary.totalMembers}</strong>
        </div>
        <div className="stat-tile">
          <span className="meta">Already covered</span>
          <strong>{summary.alreadyEnrichedMembers}</strong>
        </div>
        <div className="stat-tile">
          <span className="meta">Still missing</span>
          <strong>{summary.totalMembers - summary.alreadyEnrichedMembers}</strong>
        </div>
        <div className="stat-tile">
          <span className="meta">Latest snapshot</span>
          <strong>{summary.lastAddedFromSnapshot?.slice(0, 8) ?? "None yet"}</strong>
        </div>
      </div>
      {batch.notes ? <div className="empty-message">{batch.notes}</div> : null}
      {members.length === 0 ? (
        <div className="empty-message">
          This batch has no members yet. Add people from saved people snapshots in the
          enrichment workflow to build the batch before retrieval.
        </div>
      ) : (
        <div className="table-shell">
          <table className="results-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Title</th>
                <th>Company</th>
                <th>Source count</th>
                <th>Enrichment state</th>
                <th>Email</th>
                <th>Email status</th>
                <th>Provenance</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => {
                const enriched = enrichedByApolloId.get(member.personApolloId);

                return (
                  <tr key={member.id}>
                    <td>{member.fullName || "—"}</td>
                    <td>{member.title || "—"}</td>
                    <td>{member.companyName || "—"}</td>
                    <td>{member.provenance.length}</td>
                    <td>{formatEnrichmentState(member, enriched)}</td>
                    <td>{enriched?.email ?? "—"}</td>
                    <td>{enriched?.emailStatus ?? "—"}</td>
                    <td>
                      <details className="snapshot-param-disclosure">
                        <summary>
                          <span className="meta">
                            {member.provenance.length} snapshot
                            {member.provenance.length === 1 ? "" : "s"}
                          </span>
                        </summary>
                        <div className="snapshot-param-summary">
                          {member.provenance.map((entry) => (
                            <span key={`${entry.peopleSnapshotId}:${entry.addedAt}`}>
                              {entry.peopleSnapshotId.slice(0, 8)}
                              {entry.sourcePeopleRecipeId
                                ? ` • recipe ${entry.sourcePeopleRecipeId.slice(0, 8)}`
                                : ""}
                            </span>
                          ))}
                        </div>
                      </details>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
