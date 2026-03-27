"use client";

import React, { useMemo, useState } from "react";
import { enrichContactBatchAction } from "@/app/recipes/actions";
import { RetrievalRunStatusCard } from "@/features/retrieval-runs/components/retrieval-run-status-card";
import { InfoTip } from "@/features/ui/components/info-tip";
import type { ContactBatchRecord } from "@/lib/db/repositories/contact-batches";
import type { ContactBatchMemberCoverageRecord } from "@/lib/db/repositories/contact-batch-members";
import type { EnrichedPersonRecord } from "@/lib/db/repositories/enriched-people";
import { isVerifiedBusinessEmailQuality } from "@/lib/retrieval/quality";
import type { RetrievalRunSummary } from "@/lib/retrieval/run-summary";

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
  retrievalSummary: RetrievalRunSummary | null;
  removeMemberAction: (formData: FormData) => Promise<void>;
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

function getApolloFullName(apolloPerson: Record<string, unknown> | null) {
  if (!apolloPerson) {
    return "";
  }

  if (typeof apolloPerson.name === "string" && apolloPerson.name.trim().length > 0) {
    return apolloPerson.name;
  }

  const firstName =
    typeof apolloPerson.first_name === "string" ? apolloPerson.first_name : "";
  const lastName =
    typeof apolloPerson.last_name === "string" ? apolloPerson.last_name : "";
  const combined = `${firstName} ${lastName}`.trim();

  return combined;
}

export function ContactBatchPanel({
  batch,
  members,
  summary,
  enrichedByApolloId,
  retrievalSummary,
  removeMemberAction,
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
  const exportableMembers = useMemo(
    () =>
      members.filter((member) => {
        const enriched = enrichedByApolloId.get(member.personApolloId);
        return Boolean(enriched);
      }),
    [enrichedByApolloId, members],
  );

  function toggleSelection(personApolloId: string) {
    setSelectedApolloIds((current) =>
      current.includes(personApolloId)
        ? current.filter((value) => value !== personApolloId)
        : [...current, personApolloId],
    );
  }

  function exportBatchCsv() {
    const escapeCsv = (value: string) => `"${value.replaceAll('"', '""')}"`;
    const lines = [
      ["Company", "Full Name", "Role", "Email Address"]
        .map(escapeCsv)
        .join(","),
      ...exportableMembers.map((member) => {
        const enriched = enrichedByApolloId.get(member.personApolloId);
        return [
          member.companyName || "",
          getApolloFullName(enriched?.apolloPerson ?? null) || member.fullName || "",
          member.title || "",
          enriched?.email || "",
        ]
          .map(escapeCsv)
          .join(",");
      }),
    ];

    const blob = new Blob([lines.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${batch.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "contact-batch"}-enriched.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <section className="card stack">
      <div className="workspace-header">
        <p className="eyebrow">Current batch</p>
        <h2 className="heading-with-tip">
          <span>{batch.name}</span>
          <InfoTip
            content="Batch members keep frozen display data from source snapshots while enrichment coverage comes from the append-only enriched-people store."
            label="Current batch help"
          />
        </h2>
      </div>
      <div className="stats-grid">
        <div className="stat-tile">
          <span className="meta">People</span>
          <strong>{summary.totalMembers}</strong>
        </div>
        <div className="stat-tile">
          <span className="meta">Enriched</span>
          <strong>{summary.alreadyEnrichedMembers}</strong>
        </div>
        <div className="stat-tile">
          <span className="meta">Not yet enriched</span>
          <strong>{missingMembers.length}</strong>
        </div>
      </div>
      {batch.notes ? <div className="empty-message">{batch.notes}</div> : null}
      {members.length > 0 ? (
        <div className="batch-action-layout">
          <div className="batch-enrichment-panel">
            <div className="batch-action-header">
              <p className="meta">Enrichment</p>
              <strong>{missingMembers.length} missing</strong>
            </div>
            <div className="workspace-actions batch-enrich-actions">
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
                  Enrich selected ({selectedMissingMembers.length})
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
          </div>
          <div className="batch-utility-actions">
            <form action={removeMemberAction}>
              <input name="batchId" type="hidden" value={batch.id} />
              <input
                name="selectedApolloIds"
                type="hidden"
                value={JSON.stringify(selectedApolloIds)}
              />
              <button
                className="secondary-button destructive-button"
                disabled={selectedApolloIds.length === 0}
                type="submit"
              >
                Remove selected ({selectedApolloIds.length})
              </button>
            </form>
            <div className="batch-utility-divider" aria-hidden="true" />
            <div>
              <button
                className="secondary-button"
                disabled={exportableMembers.length === 0}
                onClick={exportBatchCsv}
                type="button"
              >
                Export enriched ({exportableMembers.length})
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {retrievalSummary ? (
        <details className="snapshot-param-disclosure batch-retrieval-disclosure">
          <summary>
            <span className="meta">
              Retrieval run
              {`: ${retrievalSummary.runStatus} · ${retrievalSummary.run.processedItems}/${retrievalSummary.run.totalItems} processed`}
            </span>
          </summary>
          <div className="batch-retrieval-panel">
            <RetrievalRunStatusCard initialSummary={retrievalSummary} />
          </div>
        </details>
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
