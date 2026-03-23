import React from "react";
import type { RetrievalRunRecord } from "@/lib/db/repositories/retrieval-runs";

export function RetrievalRunStatusCard({
  run,
}: {
  run: RetrievalRunRecord | null;
}) {
  if (!run) {
    return null;
  }

  return (
    <section className="card stack">
      <div className="workspace-header">
        <p className="eyebrow">Retrieval run</p>
        <h2>Latest persisted execution state</h2>
        <p>Progress comes from the server-backed retrieval run record, so reloads keep the latest known batch and pacing state visible.</p>
      </div>
      <div className="stats-grid">
        <div className="stat-tile">
          <span className="meta">Status</span>
          <strong>{run.status}</strong>
        </div>
        <div className="stat-tile">
          <span className="meta">Processed</span>
          <strong>{run.processedItems} / {run.totalItems}</strong>
        </div>
        <div className="stat-tile">
          <span className="meta">Successful</span>
          <strong>{run.successfulItems}</strong>
        </div>
        <div className="stat-tile">
          <span className="meta">Failed or unusable</span>
          <strong>{run.failedItems}</strong>
        </div>
        <div className="stat-tile">
          <span className="meta">Batches</span>
          <strong>{run.batchCount}</strong>
        </div>
        <div className="stat-tile">
          <span className="meta">API requests</span>
          <strong>{run.apiRequestCount}</strong>
        </div>
      </div>
      <div className="subtle-card card stack">
        <p className="meta">Last checkpoint</p>
        <p>{run.lastCheckpointAt ? formatStableDateTime(run.lastCheckpointAt) : "Not yet persisted"}</p>
        <p className="meta">Cooldown / retry</p>
        <p>
          {run.cooldownUntil || run.retryAfter
            ? `${run.cooldownUntil ? `Cooling until ${formatStableDateTime(run.cooldownUntil)}.` : ""} ${
                run.retryAfter ? `Retry scheduled for ${formatStableDateTime(run.retryAfter)}.` : ""
              }`.trim()
            : "No active cooldown or retry backoff."}
        </p>
        {run.lastError ? <p className="field-hint">{run.lastError}</p> : null}
      </div>
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
  }).format(new Date(value));
}
