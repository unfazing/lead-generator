"use client";

import React from "react";
import { useMemo, useState } from "react";
import type { EnrichedPeopleEntry } from "@/lib/db/repositories/retrieval-run-items";

export function EnrichedPeopleResults({
  entries,
}: {
  entries: EnrichedPeopleEntry[];
}) {
  const [showAllOutcomes, setShowAllOutcomes] = useState(false);

  const visibleEntries = useMemo(
    () =>
      showAllOutcomes
        ? entries
        : entries.filter((entry) => entry.quality === "verified_business_email"),
    [entries, showAllOutcomes],
  );

  if (entries.length === 0) {
    return null;
  }

  return (
    <section className="card stack">
      <div className="workspace-header">
        <p className="eyebrow">Enriched results</p>
        <h3>Stored enrichment outcomes for this snapshot</h3>
        <p>Verified business-email matches are shown first. Toggle all outcomes if you want to inspect unavailable or unverified results too.</p>
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
      {visibleEntries.length === 0 ? (
        <div className="empty-message">
          No verified business-email results have been stored for this snapshot yet.
        </div>
      ) : (
        <div className="table-shell">
          <table className="results-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Title</th>
                <th>Company</th>
                <th>Email</th>
                <th>Quality</th>
                <th>Completed</th>
              </tr>
            </thead>
            <tbody>
              {visibleEntries.map((entry) => (
                <tr key={entry.id}>
                  <td>{entry.fullName}</td>
                  <td>{entry.title || "—"}</td>
                  <td>{entry.companyName || "—"}</td>
                  <td>{entry.email || "—"}</td>
                  <td>{entry.quality ?? "pending"}</td>
                  <td>{entry.completedAt ? formatStableDateTime(entry.completedAt) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
  }).format(new Date(value));
}
