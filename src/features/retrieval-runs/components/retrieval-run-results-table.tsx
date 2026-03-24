"use client";

import React from "react";
import type { EnrichedPeopleEntry } from "@/lib/db/repositories/retrieval-run-items";
import {
  getQualityLabel,
  isVerifiedBusinessEmailQuality,
} from "@/lib/retrieval/quality";

export function RetrievalRunResultsTable({
  entries,
}: {
  entries: EnrichedPeopleEntry[];
}) {
  const sortedEntries = [...entries].sort((left, right) => {
    const leftVerified = isVerifiedBusinessEmailQuality(left.outcomeQuality);
    const rightVerified = isVerifiedBusinessEmailQuality(right.outcomeQuality);

    if (leftVerified !== rightVerified) {
      return leftVerified ? -1 : 1;
    }

    return (right.completedAt ?? right.updatedAt).localeCompare(
      left.completedAt ?? left.updatedAt,
    );
  });

  return (
    <div className="table-shell">
      <table className="results-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Title</th>
            <th>Company</th>
            <th>Email</th>
            <th>Outcome</th>
            <th>Disposition</th>
            <th>Completed</th>
          </tr>
        </thead>
        <tbody>
          {sortedEntries.map((entry) => (
            <tr key={entry.id}>
              <td>{entry.fullName}</td>
              <td>{entry.title || "—"}</td>
              <td>{entry.companyName || "—"}</td>
              <td>{entry.email || "—"}</td>
              <td>{getQualityLabel(entry.outcomeQuality)}</td>
              <td>{formatDisposition(entry.disposition)}</td>
              <td>{entry.completedAt ? formatStableDateTime(entry.completedAt) : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatDisposition(value: EnrichedPeopleEntry["disposition"]) {
  switch (value) {
    case "reused_verified":
      return "Reused verified";
    case "reused_unusable":
      return "Reused unusable";
    case "deduped_within_run":
      return "Deduped in run";
    default:
      return "Apollo call";
  }
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
