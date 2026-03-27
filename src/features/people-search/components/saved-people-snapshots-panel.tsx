"use client";

import { useMemo, useState } from "react";
import { PeopleResultsTable } from "@/features/people-search/components/people-results-table";
import { SnapshotVersionSelector } from "@/features/search-workspace/components/snapshot-version-selector";
import type { PeopleSnapshotRecord } from "@/lib/db/repositories/people-snapshots";

type SavedPeopleSnapshotsPanelProps = {
  initialSnapshotId?: string | null;
  snapshots: PeopleSnapshotRecord[];
};

export function SavedPeopleSnapshotsPanel({
  initialSnapshotId = null,
  snapshots,
}: SavedPeopleSnapshotsPanelProps) {
  const [activeSnapshotId, setActiveSnapshotId] = useState<string | null>(
    initialSnapshotId ?? snapshots[0]?.id ?? null,
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
        <p className="eyebrow">Saved people snapshots</p>
        <h2>Review saved people snapshots.</h2>
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
            onSelect={(snapshotId) => setActiveSnapshotId(snapshotId)}
            options={snapshots.map((snapshot, index) => ({
              id: snapshot.id,
              label: `${index === 0 ? "Latest" : `Older ${index}`} · ${new Date(
                snapshot.updatedAt,
              ).toLocaleDateString("en-GB", { timeZone: "UTC" })} · ${snapshot.id.slice(0, 8)}`,
            }))}
          />
          {activeSnapshot ? <PeopleResultsTable snapshot={activeSnapshot} /> : null}
        </div>
      )}
    </section>
  );
}
