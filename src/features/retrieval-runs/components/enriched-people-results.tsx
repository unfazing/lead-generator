"use client";

import React, { useMemo, useState } from "react";
import { DataSnapshotViewer } from "@/features/snapshots/components/data-snapshot-viewer";
import type { EnrichedPeopleEntry } from "@/lib/db/repositories/retrieval-run-items";
import { isVerifiedBusinessEmailQuality } from "@/lib/retrieval/quality";

const defaultColumns = [
  "apollo_id",
  "full_name",
  "company_name",
  "title",
  "quality",
  "email",
  "email_status",
  "retrieval_status",
  "completed_at",
] as const;

function stringifyPayload(value: unknown) {
  return value ? JSON.stringify(value) : "";
}

export function EnrichedPeopleResults({
  entries,
  emptyMessage = "No enrichment results available yet.",
  metaLabel = "Enriched results",
  scopeLabel = "current scope",
  title = "Stored enrichment outcomes",
}: {
  entries: EnrichedPeopleEntry[];
  emptyMessage?: string;
  metaLabel?: string;
  scopeLabel?: string;
  title?: string;
}) {
  const [showAllOutcomes, setShowAllOutcomes] = useState(false);

  const visibleEntries = useMemo(
    () =>
      showAllOutcomes
        ? entries
        : entries.filter((entry) => isVerifiedBusinessEmailQuality(entry.outcomeQuality)),
    [entries, showAllOutcomes],
  );

  const rows = useMemo(
    () =>
      visibleEntries.map((entry) => ({
        apollo_id: entry.personApolloId,
        full_name: entry.fullName,
        company_name: entry.companyName,
        title: entry.title,
        disposition: entry.disposition,
        quality: entry.outcomeQuality ?? "",
        email: entry.email ?? "",
        email_status: entry.emailStatus ?? "",
        error: entry.error ?? "",
        reused_from_run_id: entry.reusedFromRunId ?? "",
        retrieval_status: entry.retrievalStatus,
        completed_at: entry.completedAt ?? "",
        last_attempted_at: entry.lastAttemptedAt ?? "",
        people_snapshot_id: entry.peopleSnapshotId,
        provider_payload: stringifyPayload(entry.providerPayload),
      })),
    [visibleEntries],
  );
  const availableColumns = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));

  return (
    <section className="card stack">
      <div className="workspace-header">
        <p className="eyebrow">Enriched results</p>
        <h3>{title}</h3>
        <p>
          This viewer uses the shared snapshot table stack, so you can filter, sort,
          inspect, and export the stored Apollo payload for {scopeLabel}.
        </p>
      </div>
      <div className="workspace-actions">
        <button
          className="secondary-button"
          onClick={() => setShowAllOutcomes((current) => !current)}
          type="button"
        >
          {showAllOutcomes ? "Show verified only" : "Show all outcomes"}
        </button>
      </div>
      <DataSnapshotViewer
        defaultColumns={defaultColumns}
        emptyMessage={emptyMessage}
        metaDetail={`${rows.length} stored result${rows.length === 1 ? "" : "s"}`}
        metaLabel={metaLabel}
        params={{
          scope: scopeLabel,
          outcomeFilter: showAllOutcomes ? "all outcomes" : "verified only",
          payloadColumn: "provider_payload",
        }}
        snapshot={{
          result: {
            rows,
            availableColumns,
            source: "live",
          },
        }}
      />
    </section>
  );
}
