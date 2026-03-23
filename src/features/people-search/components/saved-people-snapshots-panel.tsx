"use client";

import { enrichSelectedPeopleAction } from "@/app/recipes/actions";
import { useMemo, useState } from "react";
import { PeopleResultsTable } from "@/features/people-search/components/people-results-table";
import { RetrievalRunStatusCard } from "@/features/retrieval-runs/components/retrieval-run-status-card";
import { SnapshotVersionSelector } from "@/features/search-workspace/components/snapshot-version-selector";
import type { PeopleSnapshotRecord } from "@/lib/db/repositories/people-snapshots";
import type { RetrievalRunRecord } from "@/lib/db/repositories/retrieval-runs";

type SavedPeopleSnapshotsPanelProps = {
  initialSnapshotId?: string | null;
  retrievalRunsBySnapshotId: Record<string, RetrievalRunRecord | null>;
  snapshots: PeopleSnapshotRecord[];
};

export function SavedPeopleSnapshotsPanel({
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

  return (
    <section className="card stack">
      <div className="workspace-header">
        <p className="eyebrow">Saved people snapshots</p>
        <h2>Review a saved snapshot, then enrich the people you choose.</h2>
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
                <form action={enrichSelectedPeopleAction} className="stack">
                  <input name="peopleSnapshotId" type="hidden" value={activeSnapshot.id} />
                  <input
                    name="selectedApolloIds"
                    type="hidden"
                    value={JSON.stringify(selectedApolloIds)}
                  />
                  <div className="workspace-header">
                    <p className="eyebrow">Quick enrichment</p>
                    <h3>Enrich selected people</h3>
                    <p>
                      Check one or more people in this reviewed snapshot, then start enrichment directly from their Apollo IDs.
                    </p>
                  </div>
                  <div className="workspace-actions">
                    <button
                      className="primary-button"
                      disabled={selectedApolloIds.length === 0}
                      type="submit"
                    >
                      Enrich {selectedApolloIds.length > 0 ? selectedApolloIds.length : ""} selected people
                    </button>
                  </div>
                </form>
              }
            />
          ) : null}
          <RetrievalRunStatusCard run={activeRetrievalRun} />
        </div>
      )}
    </section>
  );
}
