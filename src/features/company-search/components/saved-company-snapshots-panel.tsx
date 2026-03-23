"use client";

import { useMemo, useState } from "react";
import { CompanySearchWarning } from "@/features/company-search/components/company-search-warning";
import { CompanySnapshotPreview } from "@/features/search-workspace/components/company-snapshot-preview";
import { SnapshotVersionSelector } from "@/features/search-workspace/components/snapshot-version-selector";
import type { CompanySnapshotRecord } from "@/lib/db/repositories/company-snapshots";

type SavedCompanySnapshotsPanelProps = {
  initialSnapshotId?: string | null;
  snapshots: CompanySnapshotRecord[];
};

export function SavedCompanySnapshotsPanel({
  initialSnapshotId = null,
  snapshots,
}: SavedCompanySnapshotsPanelProps) {
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
        <p className="eyebrow">Saved company snapshots</p>
        <h2>Choose a saved snapshot version for this recipe.</h2>
      </div>
      {snapshots.length === 0 ? (
        <div className="empty-message">
          No snapshots yet. Run a live company search or reopen a stored snapshot to create one.
        </div>
      ) : (
        <div className="stack">
          <SnapshotVersionSelector
            activeId={activeSnapshotId}
            label="Snapshot version"
            onSelect={setActiveSnapshotId}
            options={snapshots.map((snapshot, index) => ({
              id: snapshot.id,
              label: `${index === 0 ? "Latest" : `Older ${index}`} · ${new Date(
                snapshot.updatedAt,
              ).toLocaleDateString("en-GB", { timeZone: "UTC" })} · ${snapshot.id.slice(0, 8)}`,
            }))}
          />
          {activeSnapshot ? (
            <>
              <CompanySearchWarning warnings={activeSnapshot.result.warnings ?? []} />
              <CompanySnapshotPreview snapshot={activeSnapshot} />
            </>
          ) : null}
        </div>
      )}
    </section>
  );
}
