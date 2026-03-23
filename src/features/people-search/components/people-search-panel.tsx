"use client";

import { useState } from "react";
import {
  applyCompaniesToPeopleRecipeAction,
  runPeopleSearchAction,
} from "@/app/recipes/actions";
import { CompanySnapshotPreview } from "@/features/search-workspace/components/company-snapshot-preview";
import type { CompanySnapshotRecord } from "@/lib/db/repositories/company-snapshots";
import type {
  PeopleRecipe,
  PeopleRecipeOrganizationImport,
} from "@/lib/recipes/schema";

type SnapshotOption = {
  recipeId: string;
  recipeName: string;
  snapshot: CompanySnapshotRecord;
};

type PeopleSearchPanelProps = {
  activeSourceSnapshotIds: string[];
  peopleRecipe: PeopleRecipe | null;
  snapshotOptions: SnapshotOption[];
};

type ImportMode = "selected" | "all";

function getInitialSelectionState(
  snapshotOptions: SnapshotOption[],
  activeSourceSnapshotIds: string[],
  imports: PeopleRecipeOrganizationImport[],
) {
  const importMap = new Map(imports.map((entry) => [entry.snapshotId, entry]));
  const activeSet = new Set(
    activeSourceSnapshotIds.length > 0
      ? activeSourceSnapshotIds
      : imports.map((entry) => entry.snapshotId),
  );

  return Object.fromEntries(
    snapshotOptions.map((option) => [
      option.snapshot.id,
      {
        enabled: activeSet.has(option.snapshot.id),
        importMode: importMap.get(option.snapshot.id)?.importMode ?? "all",
        selectedCompanyIds:
          importMap.get(option.snapshot.id)?.selectedCompanyIds ?? [],
      },
    ]),
  ) as Record<
    string,
    {
      enabled: boolean;
      importMode: ImportMode;
      selectedCompanyIds: string[];
    }
  >;
}

export function PeopleSearchPanel({
  activeSourceSnapshotIds,
  peopleRecipe,
  snapshotOptions,
}: PeopleSearchPanelProps) {
  const organizationImports = peopleRecipe?.organizationImports ?? [];
  const [selectionState, setSelectionState] = useState(() =>
    getInitialSelectionState(
      snapshotOptions,
      activeSourceSnapshotIds,
      organizationImports,
    ),
  );

  const importedSummary = organizationImports.map((entry) => ({
    ...entry,
    recipeName:
      snapshotOptions.find((option) => option.snapshot.id === entry.snapshotId)
        ?.recipeName ?? "Unknown recipe",
  }));

  if (!peopleRecipe) {
    return (
      <div className="card empty-message">
        Select a people recipe before importing companies or running people search.
      </div>
    );
  }

  const enabledSnapshots = snapshotOptions.filter(
    (option) => selectionState[option.snapshot.id]?.enabled,
  );
  const importPlan = enabledSnapshots.map((option) => ({
    snapshotId: option.snapshot.id,
    importMode: selectionState[option.snapshot.id]?.importMode ?? "all",
    selectedCompanyIds:
      selectionState[option.snapshot.id]?.selectedCompanyIds ?? [],
  }));
  const hasInvalidSelectedImport = importPlan.some(
    (entry) =>
      entry.importMode === "selected" && entry.selectedCompanyIds.length === 0,
  );
  const currentOrganizationCount = peopleRecipe.peopleFilters.organizationIds.length;

  function updateSnapshotState(
    snapshotId: string,
    updater: (current: {
      enabled: boolean;
      importMode: ImportMode;
      selectedCompanyIds: string[];
    }) => {
      enabled: boolean;
      importMode: ImportMode;
      selectedCompanyIds: string[];
    },
  ) {
    setSelectionState((current) => ({
      ...current,
      [snapshotId]: updater(
        current[snapshotId] ?? {
          enabled: false,
          importMode: "all",
          selectedCompanyIds: [],
        },
      ),
    }));
  }

  return (
    <section className="stack">
      <section className="card stack">
        <div className="workspace-header">
          <p className="eyebrow">People recipe import</p>
          <h2>Apply companies from one or more company snapshots to this recipe.</h2>
          <p>
            Snapshot choice is explicit. Import updates the saved people recipe with organization IDs and per-snapshot provenance. Search is a separate action.
          </p>
        </div>

        <div className="pairing-summary">
          <div className="stat-tile">
            <span className="meta">People recipe</span>
            <strong>{peopleRecipe.name}</strong>
          </div>
          <div className="stat-tile">
            <span className="meta">Current organization IDs</span>
            <strong>{currentOrganizationCount}</strong>
          </div>
          <div className="stat-tile">
            <span className="meta">Imported sources</span>
            <strong>{peopleRecipe.organizationImports.length}</strong>
          </div>
        </div>

        {importedSummary.length > 0 ? (
          <div className="subtle-card card stack">
            <p className="meta">Current recipe imports</p>
            {importedSummary.map((entry) => (
              <div key={entry.snapshotId} className="meta">
                {entry.recipeName} · {entry.importMode} · {entry.organizationIds.length} IDs
              </div>
            ))}
          </div>
        ) : null}

        <div className="stack">
          {snapshotOptions.map((option) => {
            const state = selectionState[option.snapshot.id] ?? {
              enabled: false,
              importMode: "all" as const,
              selectedCompanyIds: [],
            };

            return (
              <section key={option.snapshot.id} className="card stack">
                <div className="workspace-header">
                  <div className="workspace-actions">
                    <label className="option-pill">
                      <input
                        checked={state.enabled}
                        onChange={(event) =>
                          updateSnapshotState(option.snapshot.id, (current) => ({
                            ...current,
                            enabled: event.target.checked,
                          }))
                        }
                        type="checkbox"
                      />
                      <span>Use snapshot</span>
                    </label>
                  </div>
                  <h3>{option.recipeName}</h3>
                  <p>
                    Snapshot {option.snapshot.id.slice(0, 8)} · {option.snapshot.result.rows.length} companies
                  </p>
                </div>

                {state.enabled ? (
                  <>
                    <div className="option-grid">
                      <label
                        className={`option-pill${
                          state.importMode === "selected" ? " chip-active" : ""
                        }`}
                      >
                        <input
                          checked={state.importMode === "selected"}
                          name={`import-mode-${option.snapshot.id}`}
                          onChange={() =>
                            updateSnapshotState(option.snapshot.id, (current) => ({
                              ...current,
                              importMode: "selected",
                            }))
                          }
                          type="radio"
                          value="selected"
                        />
                        <span>Selected companies</span>
                      </label>
                      <label
                        className={`option-pill${
                          state.importMode === "all" ? " chip-active" : ""
                        }`}
                      >
                        <input
                          checked={state.importMode === "all"}
                          name={`import-mode-${option.snapshot.id}`}
                          onChange={() =>
                            updateSnapshotState(option.snapshot.id, (current) => ({
                              ...current,
                              importMode: "all",
                              selectedCompanyIds: [],
                            }))
                          }
                          type="radio"
                          value="all"
                        />
                        <span>All companies</span>
                      </label>
                    </div>

                    <CompanySnapshotPreview
                      onSelectionChange={(selectedCompanyIds) =>
                        updateSnapshotState(option.snapshot.id, (current) => ({
                          ...current,
                          selectedCompanyIds,
                        }))
                      }
                      selectable={state.importMode === "selected"}
                      snapshot={option.snapshot}
                      summarySlot={
                        <p className="meta">
                          {state.importMode === "selected"
                            ? state.selectedCompanyIds.length > 0
                              ? `${state.selectedCompanyIds.length} companies selected for import`
                              : "Select at least one company in this snapshot"
                            : `All ${option.snapshot.result.rows.length} companies will be imported`}
                        </p>
                      }
                    />
                  </>
                ) : null}
              </section>
            );
          })}
        </div>

        <form action={applyCompaniesToPeopleRecipeAction} className="workspace-actions">
          <input type="hidden" name="peopleRecipeId" value={peopleRecipe.id} />
          <input type="hidden" name="importPlan" value={JSON.stringify(importPlan)} />
          <button
            className="primary-button"
            disabled={importPlan.length === 0 || hasInvalidSelectedImport}
            type="submit"
          >
            Apply companies to recipe
          </button>
        </form>
      </section>

      <section className="card stack">
        <div className="workspace-header">
          <p className="eyebrow">People search</p>
          <h2>Run people search from the saved recipe state.</h2>
          <p>
            Search uses the organization IDs currently saved on the recipe. Importing snapshots does not trigger search automatically.
          </p>
        </div>
        <form action={runPeopleSearchAction} className="workspace-actions">
          <input type="hidden" name="peopleRecipeId" value={peopleRecipe.id} />
          <button
            className="primary-button"
            disabled={currentOrganizationCount === 0}
            type="submit"
          >
            Run people search
          </button>
        </form>
      </section>
    </section>
  );
}
