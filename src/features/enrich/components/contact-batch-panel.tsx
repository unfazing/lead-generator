"use client";

import React, { useMemo, useState } from "react";
import { enrichContactBatchAction } from "@/app/recipes/actions";
import type { ContactBatchRecord } from "@/lib/db/repositories/contact-batches";
import type { ContactBatchMemberCoverageRecord } from "@/lib/db/repositories/contact-batch-members";
import type { EnrichedPersonRecord } from "@/lib/db/repositories/enriched-people";
import { isVerifiedBusinessEmailQuality } from "@/lib/retrieval/quality";

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

function getEnrichmentState(
  member: ContactBatchMemberCoverageRecord,
  enriched: EnrichedPersonRecord | undefined,
) {
  if (!member.alreadyEnriched || !enriched) {
    return {
      label: "Not enriched yet",
      detail: "Eligible for Apollo if selected.",
    };
  }

  if (isVerifiedBusinessEmailQuality(enriched.quality)) {
    return {
      label: "Verified",
      detail: enriched.email ?? "Verified business email stored.",
    };
  }

  return {
    label: "Unusable",
    detail: enriched.quality,
  };
}

export function ContactBatchPanel({
  batch,
  members,
  summary,
  enrichedByApolloId,
}: ContactBatchPanelProps) {
  const [selectedApolloIds, setSelectedApolloIds] = useState<string[]>([]);

  const missingMembers = useMemo(
    () => members.filter((member) => !member.alreadyEnriched),
    [members],
  );
  const selectedMissingMembers = useMemo(
    () =>
      members.filter(
        (member) =>
          selectedApolloIds.includes(member.personApolloId) && !member.alreadyEnriched,
      ),
    [members, selectedApolloIds],
  );

  function toggleSelection(personApolloId: string) {
    setSelectedApolloIds((current) =>
      current.includes(personApolloId)
        ? current.filter((value) => value !== personApolloId)
        : [...current, personApolloId],
    );
  }

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
          <span className="meta">Already handled</span>
          <strong>{summary.alreadyEnrichedMembers}</strong>
        </div>
        <div className="stat-tile">
          <span className="meta">Still missing</span>
          <strong>{missingMembers.length}</strong>
        </div>
        <div className="stat-tile">
          <span className="meta">Latest snapshot</span>
          <strong>{summary.lastAddedFromSnapshot?.slice(0, 8) ?? "None yet"}</strong>
        </div>
      </div>
      {batch.notes ? <div className="empty-message">{batch.notes}</div> : null}
      {members.length > 0 ? (
        <div className="subtle-card card stack">
          <div className="workspace-header">
            <p className="eyebrow">Batch enrichment actions</p>
            <h3>Send only globally missing members to Apollo</h3>
            <p>
              The executor re-checks the central enriched-person store before each
              Apollo call. Previously verified and previously unusable people are
              both skipped automatically.
            </p>
          </div>
          <div className="workspace-actions">
            <form action={enrichContactBatchAction}>
              <input name="batchId" type="hidden" value={batch.id} />
              <input name="mode" type="hidden" value="selected" />
              <input
                name="selectedApolloIds"
                type="hidden"
                value={JSON.stringify(selectedApolloIds)}
              />
              <button
                className="primary-button"
                disabled={selectedMissingMembers.length === 0}
                type="submit"
              >
                Enrich selected missing ({selectedMissingMembers.length})
              </button>
            </form>
            <form action={enrichContactBatchAction}>
              <input name="batchId" type="hidden" value={batch.id} />
              <input name="mode" type="hidden" value="all-missing" />
              <input name="selectedApolloIds" type="hidden" value="[]" />
              <button
                className="secondary-button"
                disabled={missingMembers.length === 0}
                type="submit"
              >
                Enrich all missing ({missingMembers.length})
              </button>
            </form>
          </div>
          <p className="meta">
            {selectedApolloIds.length} selected. Only the {selectedMissingMembers.length}{" "}
            globally missing member
            {selectedMissingMembers.length === 1 ? "" : "s"} in that selection can
            start a new Apollo enrichment.
          </p>
        </div>
      ) : null}
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
                <th>Select</th>
                <th>Name</th>
                <th>Title</th>
                <th>Company</th>
                <th>Source count</th>
                <th>State</th>
                <th>State detail</th>
                <th>Email</th>
                <th>Email status</th>
                <th>Provenance</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => {
                const enriched = enrichedByApolloId.get(member.personApolloId);
                const state = getEnrichmentState(member, enriched);

                return (
                  <tr key={member.id}>
                    <td>
                      <input
                        checked={selectedApolloIds.includes(member.personApolloId)}
                        onChange={() => toggleSelection(member.personApolloId)}
                        type="checkbox"
                      />
                    </td>
                    <td>{member.fullName || "—"}</td>
                    <td>{member.title || "—"}</td>
                    <td>{member.companyName || "—"}</td>
                    <td>{member.provenance.length}</td>
                    <td>{state.label}</td>
                    <td>{state.detail}</td>
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
