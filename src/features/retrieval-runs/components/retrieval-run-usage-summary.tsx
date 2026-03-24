import React from "react";
import type { RetrievalRunSummary } from "@/lib/retrieval/run-summary";

export function RetrievalRunUsageSummary({
  summary,
}: {
  summary: RetrievalRunSummary;
}) {
  return (
    <div className="subtle-card card stack">
      <div className="workspace-header">
        <p className="eyebrow">Estimate vs actual</p>
        <h3>Usage reconciliation</h3>
        <p>The original run estimate stays fixed while actual counts come from persisted run and item records.</p>
      </div>
      <div className="stats-grid">
        <div className="stat-tile">
          <span className="meta">Estimated contacts</span>
          <strong>{summary.estimate.estimatedContacts}</strong>
        </div>
        <div className="stat-tile">
          <span className="meta">Actual attempted</span>
          <strong>{summary.actual.attemptedContacts}</strong>
        </div>
        <div className="stat-tile">
          <span className="meta">Reused / deduped</span>
          <strong>{summary.actual.reusedContacts}</strong>
        </div>
        <div className="stat-tile">
          <span className="meta">Missing or unusable</span>
          <strong>{summary.actual.missingContacts}</strong>
        </div>
        <div className="stat-tile">
          <span className="meta">Apollo credits consumed</span>
          <strong>
            {summary.actual.creditsConsumed === null
              ? "Not available"
              : summary.actual.creditsConsumed}
          </strong>
        </div>
      </div>
      <p className="field-hint">{summary.estimate.estimateSummary}</p>
    </div>
  );
}
