"use client";

import { useState } from "react";
import { runPeopleSearchAction } from "@/app/recipes/actions";
import type { CompanySnapshotRecord } from "@/lib/db/repositories/company-snapshots";
import type { PeopleRecipe } from "@/lib/recipes/schema";

type PeopleSearchPanelProps = {
  companyRecipeId: string;
  companySnapshot: CompanySnapshotRecord | null;
  peopleRecipe: PeopleRecipe | null;
  selectedCompanyIds: string[];
};

export function PeopleSearchPanel({
  companyRecipeId,
  companySnapshot,
  peopleRecipe,
  selectedCompanyIds,
}: PeopleSearchPanelProps) {
  const [mode, setMode] = useState<"selected" | "all">("selected");

  if (!companySnapshot || !peopleRecipe) {
    return (
      <div className="card empty-message">
        Select both a company recipe and a people recipe before running people search.
      </div>
    );
  }

  const selectedCount = selectedCompanyIds.length;
  const canRunSelected = selectedCount > 0;

  return (
    <section className="card stack">
      <div className="workspace-header">
        <p className="eyebrow">People search</p>
        <h2>Run people preview from the current company snapshot</h2>
        <p>
          Choose whether to search across all companies in the snapshot or only the companies you selected in the reviewed company table.
        </p>
      </div>

      <form action={runPeopleSearchAction} className="stack">
        <input type="hidden" name="companyRecipeId" value={companyRecipeId} />
        <input type="hidden" name="companySnapshotId" value={companySnapshot.id} />
        <input type="hidden" name="peopleRecipeId" value={peopleRecipe.id} />
        {selectedCompanyIds.map((companyId) => (
          <input key={companyId} type="hidden" name="selectedCompanyIds" value={companyId} />
        ))}

        <div className="pairing-summary">
          <div className="stat-tile">
            <span className="meta">People recipe</span>
            <strong>{peopleRecipe.name}</strong>
          </div>
          <div className="stat-tile">
            <span className="meta">Selected companies</span>
            <strong>{selectedCount}</strong>
          </div>
        </div>

        <div className="filter-section">
          <div className="section-heading">
            <h3>Search scope</h3>
            <p className="field-hint">
              Manual selection stays on the company snapshot review surface. Switch to all companies when you want a broader preview run.
            </p>
          </div>
          <div className="option-grid">
            <label className={`option-pill${mode === "selected" ? " chip-active" : ""}`}>
              <input
                checked={mode === "selected"}
                name="mode"
                onChange={() => setMode("selected")}
                type="radio"
                value="selected"
              />
              <span>Selected companies</span>
            </label>
            <label className={`option-pill${mode === "all" ? " chip-active" : ""}`}>
              <input
                checked={mode === "all"}
                name="mode"
                onChange={() => setMode("all")}
                type="radio"
                value="all"
              />
              <span>All companies in snapshot</span>
            </label>
          </div>
        </div>

        <div className="subtle-card card">
          <p className="meta">
            {mode === "selected"
              ? canRunSelected
                ? `Using ${selectedCount} selected companies from the current company snapshot.`
                : "Pick one or more companies in the company results table before using selected-companies mode."
              : `Using all ${companySnapshot.result.rows.length} companies from the current company snapshot.`}
          </p>
        </div>

        <div className="workspace-actions">
          <button
            className="primary-button"
            disabled={mode === "selected" && !canRunSelected}
            type="submit"
          >
            Run people search
          </button>
        </div>
      </form>
    </section>
  );
}
