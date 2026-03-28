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

  const querySummary = useMemo(() => {
    if (!activeSnapshot) {
      return null;
    }

    const requestedOrganizations =
      activeSnapshot.result.request.organizationIds.length;
    const sourceSnapshotCount = activeSnapshot.organizationImports.length || 1;
    const selectedImportCount = activeSnapshot.organizationImports.filter(
      (entry) => entry.importMode === "selected",
    ).length;

    return {
      sourceSnapshotCount,
      requestedOrganizations,
      selectedImportCount,
      pageSize: activeSnapshot.result.request.perPage,
      ranAt: formatStableDateTime(activeSnapshot.updatedAt),
    };
  }, [activeSnapshot]);

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
          {querySummary ? (
            <section className="subtle-card card stack">
              <div className="workspace-header">
                <p className="eyebrow">Last run</p>
                <h3>Query summary</h3>
              </div>
              <dl className="compact-summary-list">
                <div className="compact-summary-item">
                  <dt>Ran at</dt>
                  <dd>{querySummary.ranAt}</dd>
                </div>
                <div className="compact-summary-item">
                  <dt>Source snapshots</dt>
                  <dd>{querySummary.sourceSnapshotCount}</dd>
                </div>
                <div className="compact-summary-item">
                  <dt>Companies queried</dt>
                  <dd>{querySummary.requestedOrganizations}</dd>
                </div>
                <div className="compact-summary-item">
                  <dt>Selected imports</dt>
                  <dd>{querySummary.selectedImportCount}</dd>
                </div>
                <div className="compact-summary-item">
                  <dt>Rows per page</dt>
                  <dd>{querySummary.pageSize}</dd>
                </div>
              </dl>
            </section>
          ) : null}
          {activeSnapshot ? <PeopleResultsTable snapshot={activeSnapshot} /> : null}
        </div>
      )}
    </section>
  );
}

function formatStableDateTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
    hour12: false,
  }).format(new Date(value));
}
