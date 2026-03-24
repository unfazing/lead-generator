"use client";

import React from "react";
import { useEffect, useState } from "react";
import { resumeRetrievalRunAction } from "@/app/recipes/actions";
import { RetrievalRunUsageSummary } from "@/features/retrieval-runs/components/retrieval-run-usage-summary";
import type { RetrievalRunSummary } from "@/lib/retrieval/run-summary";

export function RetrievalRunStatusCard({
  initialSummary,
}: {
  initialSummary: RetrievalRunSummary | null;
}) {
  const [summary, setSummary] = useState<RetrievalRunSummary | null>(initialSummary);

  useEffect(() => {
    if (!initialSummary) {
      setSummary(null);
      return;
    }

    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | null = null;

    const runId = initialSummary.runId;

    async function load() {
      const response = await fetch(`/api/retrieval-runs/${runId}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        return;
      }

      const next = (await response.json()) as RetrievalRunSummary;
      if (!cancelled) {
        setSummary(next);
      }
    }

    void load();

    if (
      initialSummary.runStatus === "active" ||
      initialSummary.runStatus === "cooldown" ||
      initialSummary.runStatus === "retrying" ||
      initialSummary.runStatus === "interrupted"
    ) {
      timer = setInterval(() => {
        void load();
      }, 5_000);
    }

    return () => {
      cancelled = true;
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [initialSummary]);

  if (!summary) {
    return null;
  }

  const run = summary.run;
  const visibleStatus = summary.runStatus;
  const lastCheckpointAt = summary.lastCheckpointAt;
  const lastHeartbeatAt = summary.lastHeartbeatAt;

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
          <strong>{visibleStatus}</strong>
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
      <div className="stats-grid">
        <div className="stat-tile">
          <span className="meta">Pending Apollo calls</span>
          <strong>{summary.preflight.pendingCallCount}</strong>
        </div>
        <div className="stat-tile">
          <span className="meta">Reused from cache</span>
          <strong>{run.reusedItems}</strong>
        </div>
        <div className="stat-tile">
          <span className="meta">Deduped in run</span>
          <strong>{summary.preflight.dedupedWithinRunCount}</strong>
        </div>
        <div className="stat-tile">
          <span className="meta">Sent to Apollo</span>
          <strong>{run.apolloRequestedItems}</strong>
        </div>
        <div className="stat-tile">
          <span className="meta">New enrichments</span>
          <strong>{run.newlyEnrichedItems}</strong>
        </div>
      </div>
      <div className="stats-grid">
        <div className="stat-tile">
          <span className="meta">Reused verified</span>
          <strong>{summary.preflight.reusedVerifiedCount}</strong>
        </div>
        <div className="stat-tile">
          <span className="meta">Reused unusable</span>
          <strong>{summary.preflight.reusedUnusableCount}</strong>
        </div>
      </div>
      <RetrievalRunUsageSummary summary={summary} />
      {summary.runStatus === "interrupted" && summary.resumeTargets.unresolved > 0 ? (
        <form action={resumeRetrievalRunAction} className="subtle-card card stack">
          <input type="hidden" name="runId" value={run.id} />
          <p className="meta">Resume available</p>
          <p>
            This run was interrupted after {summary.progress.processed} processed contact(s).{" "}
            {summary.resumeTargets.unresolved} contact(s) remain unresolved.
          </p>
          <div className="workspace-actions">
            <button className="primary-button" type="submit">
              Resume retrieval run
            </button>
          </div>
        </form>
      ) : null}
      <div className="subtle-card card stack">
        <p className="meta">Last checkpoint</p>
        <p>{lastCheckpointAt ? formatStableDateTime(lastCheckpointAt) : "Not yet persisted"}</p>
        <p className="meta">Last heartbeat</p>
        <p>{lastHeartbeatAt ? formatStableDateTime(lastHeartbeatAt) : "No heartbeat yet"}</p>
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
