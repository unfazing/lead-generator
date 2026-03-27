"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PeopleResultsTable } from "@/features/people-search/components/people-results-table";
import { EnrichedPeopleResults } from "@/features/retrieval-runs/components/enriched-people-results";
import { RetrievalRunStatusCard } from "@/features/retrieval-runs/components/retrieval-run-status-card";
import { SnapshotVersionSelector } from "@/features/search-workspace/components/snapshot-version-selector";
import type { PeopleSnapshotRecord } from "@/lib/db/repositories/people-snapshots";
import type { EnrichedPeopleEntry } from "@/lib/db/repositories/retrieval-run-items";
import type { RetrievalRunSummary } from "@/lib/retrieval/run-summary";

type SavedPeopleSnapshotsPanelProps = {
  enrichedEntriesBySnapshotId: Record<string, EnrichedPeopleEntry[]>;
  initialSnapshotId?: string | null;
  retrievalRunsBySnapshotId: Record<string, RetrievalRunSummary | null>;
  snapshots: PeopleSnapshotRecord[];
};

export function SavedPeopleSnapshotsPanel({
  enrichedEntriesBySnapshotId,
  initialSnapshotId = null,
  retrievalRunsBySnapshotId,
  snapshots,
}: SavedPeopleSnapshotsPanelProps) {
  const [activeSnapshotId, setActiveSnapshotId] = useState<string | null>(
    initialSnapshotId ?? snapshots[0]?.id ?? null,
  );
  const [selectedApolloIds, setSelectedApolloIds] = useState<string[]>([]);

  const activeSnapshot = useMemo(
    () =>
      activeSnapshotId
        ? snapshots.find((snapshot) => snapshot.id === activeSnapshotId) ?? null
        : null,
    [activeSnapshotId, snapshots],
  );
  const activeRetrievalRun = activeSnapshot
    ? retrievalRunsBySnapshotId[activeSnapshot.id] ?? null
    : null;
  const activeEnrichedEntries = activeSnapshot
    ? enrichedEntriesBySnapshotId[activeSnapshot.id] ?? []
    : [];

  return (
    <section className="card stack">
      <div className="workspace-header">
        <p className="eyebrow">Saved people snapshots</p>
        <h2>Review saved people snapshots, then move into the enrich workflow.</h2>
      </div>
      {snapshots.length === 0 ? (
        <div className="empty-message">
          No people snapshots yet. Run people search from this recipe to create one.
        </div>
      ) : (
        <div className="stack">
          <SnapshotVersionSelector
            activeId={activeSnapshotId}
            label="Snapshot version"
            onSelect={(snapshotId) => {
              setActiveSnapshotId(snapshotId);
              setSelectedApolloIds([]);
            }}
            options={snapshots.map((snapshot, index) => ({
              id: snapshot.id,
              label: `${index === 0 ? "Latest" : `Older ${index}`} · ${new Date(
                snapshot.updatedAt,
              ).toLocaleDateString("en-GB", { timeZone: "UTC" })} · ${snapshot.id.slice(0, 8)}`,
            }))}
          />
          {activeSnapshot ? (
            <PeopleResultsTable
              onSelectionChange={setSelectedApolloIds}
              selectable
              snapshot={activeSnapshot}
              summarySlot={
                <div className="stack">
                  <div className="workspace-header">
                    <p className="eyebrow">Enrichment handoff</p>
                    <h3>Add reviewed people inside `/enrich`</h3>
                    <p>
                      Use this page to produce and review saved people snapshots. The
                      batch-centric enrichment workspace now owns adding members and
                      running verified-email retrieval.
                    </p>
                  </div>
                  <div className="workspace-actions">
                    <Link
                      className="primary-button"
                      href={`/enrich?sourceSnapshot=${activeSnapshot.id}`}
                    >
                      Open enrich workspace
                    </Link>
                  </div>
                  {selectedApolloIds.length > 0 ? (
                    <p className="meta">
                      {selectedApolloIds.length} row
                      {selectedApolloIds.length === 1 ? "" : "s"} selected here for
                      review. Re-select them in `/enrich` when adding to a batch.
                    </p>
                  ) : null}
                </div>
              }
            />
          ) : null}
          <EnrichedPeopleResults entries={activeEnrichedEntries} />
          <RetrievalRunStatusCard initialSummary={activeRetrievalRun} />
        </div>
      )}
    </section>
  );
}
