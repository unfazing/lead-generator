"use client";

import React from "react";
import { useMemo, useState } from "react";
import { RetrievalRunResultsTable } from "@/features/retrieval-runs/components/retrieval-run-results-table";
import type { EnrichedPeopleEntry } from "@/lib/db/repositories/retrieval-run-items";
import { isVerifiedBusinessEmailQuality } from "@/lib/retrieval/quality";

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
        : entries.filter((entry) => isVerifiedBusinessEmailQuality(entry.outcomeQuality)),
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
        <RetrievalRunResultsTable entries={visibleEntries} />
      )}
    </section>
  );
}
