"use client";

import { useState } from "react";
import {
  applyCompaniesToPeopleRecipeAction,
  runPeopleSearchAction,
} from "@/app/recipes/actions";
import {
  peopleFilterDefinitions,
} from "@/lib/apollo/people-filter-definitions";
import { CompanySnapshotPreview } from "@/features/search-workspace/components/company-snapshot-preview";
import { RecipeSnapshotChooser } from "@/features/search-workspace/components/recipe-snapshot-chooser";
import { InfoTip } from "@/features/ui/components/info-tip";
import type { CompanySnapshotRecord } from "@/lib/db/repositories/company-snapshots";
import type { PeopleRecipe, PeopleRecipeOrganizationImport } from "@/lib/recipes/schema";

type SnapshotOption = {
  recipeId: string;
  recipeName: string;
  snapshot: CompanySnapshotRecord;
};

type SnapshotRecipeGroup = {
  recipeId: string;
  recipeName: string;
  snapshots: SnapshotOption[];
};

type PeopleSearchPanelProps = {
  peopleRecipe: PeopleRecipe | null;
  snapshotGroups: SnapshotRecipeGroup[];
};

type ImportMode = "selected" | "all";

type SnapshotSelectionState = {
  importMode: ImportMode;
  selectedCompanyIds: string[];
};

type SavedCompanyChip = {
  id: string;
  label: string;
};

function formatFilterLabel(key: string) {
  return key
    .split(/(?=[A-Z])|_/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getDisplayValue(value: unknown) {
  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(", ") : "None";
  }

  return String(value ?? "").trim() || "None";
}

function hasMeaningfulValue(value: unknown) {
  if (Array.isArray(value)) {
    return value.length > 0;
  }

  if (typeof value === "number") {
    return true;
  }

  if (typeof value === "boolean") {
    return value;
  }

  return String(value ?? "").trim().length > 0;
}

function getInitialActiveSnapshotIds(snapshotGroups: SnapshotRecipeGroup[]) {
  return Object.fromEntries(
    snapshotGroups.map((group) => [group.recipeId, group.snapshots[0]?.snapshot.id ?? ""]),
  ) as Record<string, string>;
}

function areStringArraysEqual(left: string[], right: string[]) {
  return (
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  );
}

function getInitialSelectionState(
  snapshotOptions: SnapshotOption[],
  imports: PeopleRecipeOrganizationImport[],
) {
  const importMap = new Map(imports.map((entry) => [entry.snapshotId, entry]));

  return Object.fromEntries(
    snapshotOptions.map((option) => [
      option.snapshot.id,
      {
        importMode: importMap.get(option.snapshot.id)?.importMode ?? "all",
        selectedCompanyIds:
          importMap.get(option.snapshot.id)?.selectedCompanyIds ?? [],
      },
    ]),
  ) as Record<string, SnapshotSelectionState>;
}

function getImportSummary(
  snapshotOption: SnapshotOption,
  state: SnapshotSelectionState,
) {
  if (state.importMode === "all") {
    return `All ${snapshotOption.snapshot.result.rows.length} companies will be added to this recipe.`;
  }

  if (state.selectedCompanyIds.length === 0) {
    return "Choose one or more companies from this snapshot before applying.";
  }

  return `${state.selectedCompanyIds.length} selected compan${
    state.selectedCompanyIds.length === 1 ? "y" : "ies"
  } will be added to this recipe.`;
}

export function PeopleSearchPanel({
  peopleRecipe,
  snapshotGroups,
}: PeopleSearchPanelProps) {
  const snapshotOptions = snapshotGroups.flatMap((group) => group.snapshots);
  const savedCompanies = Array.from(
    peopleRecipe?.peopleFilters.organizationIds ?? [],
  )
    .map<SavedCompanyChip>((organizationId) => {
      const matchingRow = snapshotOptions
        .flatMap((option) => option.snapshot.result.rows)
        .find((row) => row.apollo_id === organizationId);

      return {
        id: organizationId,
        label:
          matchingRow?.name ||
          matchingRow?.primary_domain ||
          matchingRow?.website_url ||
          organizationId,
      };
    })
    .sort((left, right) => left.label.localeCompare(right.label));
  const organizationImports = peopleRecipe?.organizationImports ?? [];
  const labelMap = new Map(
    peopleFilterDefinitions.map((definition) => [definition.key, definition.label]),
  );
  const [activeSnapshotIds, setActiveSnapshotIds] = useState(() =>
    getInitialActiveSnapshotIds(snapshotGroups),
  );
  const [selectedRecipeIds, setSelectedRecipeIds] = useState<string[]>([]);
  const [expandedRecipeIds, setExpandedRecipeIds] = useState<string[]>([]);
  const [selectionState, setSelectionState] = useState(() =>
    getInitialSelectionState(
      snapshotOptions,
      organizationImports,
    ),
  );

  if (!peopleRecipe) {
    return (
      <div className="card empty-message">
        Select a people recipe before importing companies or running people search.
      </div>
    );
  }

  const enabledSnapshots = snapshotGroups
    .filter((group) => selectedRecipeIds.includes(group.recipeId))
    .map((group) => {
      const activeSnapshotId =
        activeSnapshotIds[group.recipeId] ?? group.snapshots[0]?.snapshot.id;
      return (
        group.snapshots.find((entry) => entry.snapshot.id === activeSnapshotId) ??
        group.snapshots[0]
      );
    })
    .filter(
      (option): option is SnapshotOption => Boolean(option),
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
  const selectedSnapshotCount = enabledSnapshots.length;
  const selectedCompanyCount = importPlan.reduce(
    (sum, entry) => sum + entry.selectedCompanyIds.length,
    0,
  );
  const sortedFilters = Object.entries(peopleRecipe.peopleFilters).sort(
    ([leftKey], [rightKey]) => {
      const leftLabel =
        labelMap.get(leftKey as keyof typeof peopleRecipe.peopleFilters) ??
        formatFilterLabel(leftKey);
      const rightLabel =
        labelMap.get(rightKey as keyof typeof peopleRecipe.peopleFilters) ??
        formatFilterLabel(rightKey);

      return leftLabel.localeCompare(rightLabel);
    },
  );
  const populatedFilters = sortedFilters.filter(([, value]) =>
    hasMeaningfulValue(value),
  );
  const emptyFilters = sortedFilters.filter(([, value]) => !hasMeaningfulValue(value));

  function updateSnapshotState(
    snapshotId: string,
    updater: (current: {
      importMode: ImportMode;
      selectedCompanyIds: string[];
    }) => {
      importMode: ImportMode;
      selectedCompanyIds: string[];
    },
  ) {
    setSelectionState((current) => {
      const previousState = current[snapshotId] ?? {
        importMode: "all" as const,
        selectedCompanyIds: [],
      };
      const nextState = updater(previousState);

      if (
        previousState.importMode === nextState.importMode &&
        areStringArraysEqual(
          previousState.selectedCompanyIds,
          nextState.selectedCompanyIds,
        )
      ) {
        return current;
      }

      return {
        ...current,
        [snapshotId]: nextState,
      };
    });
  }

  function updateActiveSnapshot(recipeId: string, snapshotId: string) {
    setActiveSnapshotIds((current) =>
      current[recipeId] === snapshotId
        ? current
        : {
            ...current,
            [recipeId]: snapshotId,
          },
    );
  }

  return (
    <section className="stack">
      <section className="card stack">
        <div className="workspace-header">
          <p className="eyebrow">People search</p>
          <div className="heading-with-tip">
            <h2>Run people search</h2>
            <InfoTip
              content="Search uses the organization IDs currently saved on the recipe. Choosing companies below updates the recipe, but search only runs when you click this button."
              label="People search help"
            />
          </div>
        </div>

        <div className="pairing-summary">
          <div className="stat-tile">
            <span className="meta">People recipe</span>
            <strong>{peopleRecipe.name}</strong>
          </div>
        </div>

        <section className="filter-section">
          <details className="filter-details">
            <summary className="filter-details-summary">
              Active recipe fields
            </summary>
            <div className="field-grid filter-details-body">
              {populatedFilters.map(([key, value]) => {
                const label =
                  labelMap.get(key as keyof typeof peopleRecipe.peopleFilters) ??
                  formatFilterLabel(key);
                const displayValue = getDisplayValue(value);

                return (
                  <div
                    key={key}
                    className={`field search-filter-summary${
                      Array.isArray(value) ? " full" : ""
                    }`}
                  >
                    <label>{label}</label>
                    <div className="summary-value">{displayValue}</div>
                  </div>
                );
              })}
            </div>
          </details>
          <details className="filter-details">
            <summary className="filter-details-summary">
              Unused recipe fields
            </summary>
            <div className="field-grid filter-details-body">
              {emptyFilters.map(([key, value]) => {
                const label =
                  labelMap.get(key as keyof typeof peopleRecipe.peopleFilters) ??
                  formatFilterLabel(key);
                const displayValue = getDisplayValue(value);

                return (
                  <div
                    key={key}
                    className={`field search-filter-summary${
                      Array.isArray(value) ? " full" : ""
                    }`}
                  >
                    <label>{label}</label>
                    <div className="summary-value">{displayValue}</div>
                  </div>
                );
              })}
            </div>
          </details>
        </section>

        <form action={runPeopleSearchAction} className="workspace-actions">
          <input type="hidden" name="peopleRecipeId" value={peopleRecipe.id} />
          <button
            className="primary-button"
            disabled={peopleRecipe.peopleFilters.organizationIds.length === 0}
            type="submit"
          >
            Run people search
          </button>
        </form>
      </section>

      <section className="card stack">
        <div className="workspace-header">
          <p className="eyebrow">People recipe companies</p>
          <div className="heading-with-tip">
            <h2>Companies already on this recipe.</h2>
            <InfoTip
              content="These are the organization IDs currently saved on the people recipe. You can add more companies from saved company snapshots below, then run people search separately."
              label="People recipe companies help"
            />
          </div>
        </div>

        {savedCompanies.length > 0 ? (
          <div className="chip-grid">
            {savedCompanies.map((company) => (
              <span key={company.id} className="chip">
                {company.label}
              </span>
            ))}
          </div>
        ) : (
          <div className="empty-message">
            No companies are attached to this people recipe yet.
          </div>
        )}

        <section className="stack">
          <div className="workspace-header">
            <p className="eyebrow">Add more companies</p>
            <div className="heading-with-tip">
              <h3>Choose from company recipes that already have saved snapshots.</h3>
              <InfoTip
                content="Pick a company recipe, review its latest snapshot by default, switch to an older snapshot only if needed, then apply the companies you want to add."
                label="Add more companies help"
              />
            </div>
          </div>

          <RecipeSnapshotChooser
            activeSnapshotIds={activeSnapshotIds}
            expandedRecipeIds={expandedRecipeIds}
            groups={snapshotGroups.map((group) => ({
              recipeId: group.recipeId,
              recipeName: group.recipeName,
              recipeLabel: "Company recipe",
              snapshots: group.snapshots.map((entry) => ({
                id: entry.snapshot.id,
                count: entry.snapshot.result.rows.length,
              })),
              countLabel: "companies",
            }))}
            selectedRecipeIds={selectedRecipeIds}
            onAddRecipe={(recipeId) => {
              setSelectedRecipeIds((current) => [...current, recipeId]);
            }}
            onRemoveRecipe={(recipeId) => {
              const snapshotId =
                activeSnapshotIds[recipeId] ??
                snapshotGroups.find((group) => group.recipeId === recipeId)?.snapshots[0]
                  ?.snapshot.id;
              setSelectedRecipeIds((current) =>
                current.filter((currentRecipeId) => currentRecipeId !== recipeId),
              );
              setExpandedRecipeIds((current) =>
                current.filter((currentRecipeId) => currentRecipeId !== recipeId),
              );
              if (snapshotId) {
                setSelectionState((current) => {
                  const next = { ...current };
                  delete next[snapshotId];
                  return next;
                });
              }
            }}
            onToggleExpanded={(recipeId) => {
              setExpandedRecipeIds((current) =>
                current.includes(recipeId)
                  ? current.filter((currentRecipeId) => currentRecipeId !== recipeId)
                  : [...current, recipeId],
              );
            }}
            onSelectSnapshot={(recipeId, snapshotId) => {
              updateActiveSnapshot(recipeId, snapshotId);
              const nextState = selectionState[snapshotId];
              if (!nextState) {
                updateSnapshotState(snapshotId, () => ({
                  importMode: "all",
                  selectedCompanyIds: [],
                }));
              }
            }}
          />

          {snapshotGroups.map((group) => {
            const activeSnapshotId =
              activeSnapshotIds[group.recipeId] ?? group.snapshots[0]?.snapshot.id;
            const option =
              group.snapshots.find((entry) => entry.snapshot.id === activeSnapshotId) ??
              group.snapshots[0];

            if (!option) {
              return null;
            }

            const state = selectionState[option.snapshot.id] ?? {
              enabled: false,
              importMode: "all" as const,
              selectedCompanyIds: [],
            };

            return selectedRecipeIds.includes(group.recipeId) &&
              expandedRecipeIds.includes(group.recipeId) ? (
              <section key={`${group.recipeId}-viewer`} className="stack">
                        <div className="option-grid">
                          <button
                            className={`option-pill chip-button${
                              state.importMode === "selected" ? " chip-active" : ""
                            }`}
                            onClick={() =>
                              updateSnapshotState(option.snapshot.id, (current) => ({
                                ...current,
                                importMode: "selected",
                              }))
                            }
                            type="button"
                          >
                            Selected companies
                          </button>
                          <button
                            className={`option-pill chip-button${
                              state.importMode === "all" ? " chip-active" : ""
                            }`}
                            onClick={() =>
                              updateSnapshotState(option.snapshot.id, (current) => ({
                                ...current,
                                importMode: "all",
                                selectedCompanyIds: [],
                              }))
                            }
                            type="button"
                          >
                            All companies
                          </button>
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
                            <div className="workflow-inline-summary">
                              <span className="meta">
                                {getImportSummary(option, state)}
                              </span>
                            </div>
                          }
                        />
              </section>
            ) : null;
          })}
        </section>

        <section className="subtle-card card stack">
          <div className="workspace-header">
            <p className="eyebrow">Apply company selection</p>
            <div className="heading-with-tip">
              <h3>Add the selected companies to this recipe.</h3>
              <InfoTip
                content="This appends the selected companies onto the recipe, removes duplicates automatically, and does not run people search."
                label="Apply company selection help"
              />
            </div>
          </div>

          <dl className="compact-summary-list">
            <div className="compact-summary-item">
              <dt>Snapshots in use</dt>
              <dd>{selectedSnapshotCount}</dd>
            </div>
            <div className="compact-summary-item">
              <dt>Checked companies</dt>
              <dd>{selectedCompanyCount}</dd>
            </div>
          </dl>

          {hasInvalidSelectedImport ? (
            <div className="warning-banner">
              <strong>Finish snapshot selection</strong>
              <p>
                One or more snapshots are set to selected-company mode but do not have any companies checked yet.
              </p>
            </div>
          ) : null}

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
      </section>
    </section>
  );
}
