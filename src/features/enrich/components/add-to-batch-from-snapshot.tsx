"use client";

import { useMemo, useState } from "react";
import { addSnapshotPeopleToBatchAction } from "@/app/recipes/actions";
import { PeopleResultsTable } from "@/features/people-search/components/people-results-table";
import { SnapshotVersionSelector } from "@/features/search-workspace/components/snapshot-version-selector";
import type { ContactBatchRecord } from "@/lib/db/repositories/contact-batches";
import type { PeopleSnapshotRecord } from "@/lib/db/repositories/people-snapshots";

type AddToBatchFromSnapshotProps = {
  activeBatchId: string | null;
  batches: ContactBatchRecord[];
  initialSnapshotId?: string | null;
  snapshots: PeopleSnapshotRecord[];
};

export function AddToBatchFromSnapshot({
  activeBatchId,
  batches,
  initialSnapshotId = null,
  snapshots,
}: AddToBatchFromSnapshotProps) {
  const [activeSnapshotId, setActiveSnapshotId] = useState<string | null>(
    initialSnapshotId ?? snapshots[0]?.id ?? null,
  );
  const [selectedApolloIds, setSelectedApolloIds] = useState<string[]>([]);
  const [destinationMode, setDestinationMode] = useState<"existing" | "new">(
    activeBatchId ? "existing" : "new",
  );
  const [selectedBatchId, setSelectedBatchId] = useState<string>(
    activeBatchId ?? batches[0]?.id ?? "",
  );

  const activeSnapshot = useMemo(
    () =>
      activeSnapshotId
        ? snapshots.find((snapshot) => snapshot.id === activeSnapshotId) ?? null
        : null,
    [activeSnapshotId, snapshots],
  );

  return (
    <section className="card stack">
      <div className="workspace-header">
        <p className="eyebrow">Add from saved people snapshots</p>
        <h2>Choose source people, then add them into a batch.</h2>
        <p>
          This tool only accepts people already present in saved people snapshots.
          Batch membership dedupes by Apollo person ID while preserving every source
          snapshot reference.
        </p>
      </div>
      {snapshots.length === 0 ? (
        <div className="empty-message">
          No saved people snapshots yet. Run people search first, then come back here
          to add reviewed people into a contact batch.
        </div>
      ) : (
        <div className="stack">
          <SnapshotVersionSelector
            activeId={activeSnapshotId}
            label="People snapshot"
            onSelect={(snapshotId) => {
              setActiveSnapshotId(snapshotId);
              setSelectedApolloIds([]);
            }}
            options={snapshots.map((snapshot) => ({
              id: snapshot.id,
              label: `${new Date(snapshot.updatedAt).toLocaleDateString("en-GB", {
                timeZone: "UTC",
              })} · ${snapshot.id.slice(0, 8)} · recipe ${snapshot.peopleRecipeId.slice(0, 8)}`,
            }))}
          />
          {activeSnapshot ? (
            <PeopleResultsTable
              onSelectionChange={setSelectedApolloIds}
              selectable
              snapshot={activeSnapshot}
              summarySlot={
                <form action={addSnapshotPeopleToBatchAction} className="stack">
                  <input name="peopleSnapshotId" type="hidden" value={activeSnapshot.id} />
                  <input
                    name="selectedApolloIds"
                    type="hidden"
                    value={JSON.stringify(selectedApolloIds)}
                  />
                  <div className="workspace-header">
                    <p className="eyebrow">Destination batch</p>
                    <h3>Add {selectedApolloIds.length || ""} selected people</h3>
                    <p>
                      Send the checked people into the current batch or create a new
                      batch from this snapshot selection.
                    </p>
                  </div>
                  <div className="field-grid">
                    <label className="field">
                      <span>Destination</span>
                      <select
                        name="destinationMode"
                        onChange={(event) =>
                          setDestinationMode(event.target.value as "existing" | "new")
                        }
                        value={destinationMode}
                      >
                        <option disabled={batches.length === 0} value="existing">
                          Add to existing batch
                        </option>
                        <option value="new">Create new batch</option>
                      </select>
                    </label>
                    {destinationMode === "existing" ? (
                      <label className="field">
                        <span>Batch</span>
                        <select
                          name="batchId"
                          onChange={(event) => setSelectedBatchId(event.target.value)}
                          required
                          value={selectedBatchId}
                        >
                          {batches.map((batch) => (
                            <option key={batch.id} value={batch.id}>
                              {batch.name}
                            </option>
                          ))}
                        </select>
                      </label>
                    ) : (
                      <>
                        <label className="field">
                          <span>New batch name</span>
                          <input name="newBatchName" placeholder="HR targets from March snapshots" />
                        </label>
                        <label className="field">
                          <span>New batch notes</span>
                          <textarea name="newBatchNotes" rows={3} />
                        </label>
                      </>
                    )}
                  </div>
                  <div className="workspace-actions">
                    <button
                      className="primary-button"
                      disabled={
                        selectedApolloIds.length === 0 ||
                        (destinationMode === "existing" && !selectedBatchId)
                      }
                      type="submit"
                    >
                      Add {selectedApolloIds.length > 0 ? selectedApolloIds.length : ""}{" "}
                      people to {destinationMode === "existing" ? "batch" : "new batch"}
                    </button>
                  </div>
                </form>
              }
            />
          ) : null}
        </div>
      )}
    </section>
  );
}
