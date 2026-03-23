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
import { InfoTip } from "@/features/ui/components/info-tip";
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

type SnapshotRecipeGroup = {
  recipeId: string;
  recipeName: string;
  snapshots: SnapshotOption[];
};

type PeopleSearchPanelProps = {
  activeSourceSnapshotIds: string[];
  peopleRecipe: PeopleRecipe | null;
  snapshotGroups: SnapshotRecipeGroup[];
};

type ImportMode = "selected" | "all";

type SnapshotSelectionState = {
  enabled: boolean;
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
  _activeSourceSnapshotIds: string[],
  imports: PeopleRecipeOrganizationImport[],
) {
  const importMap = new Map(imports.map((entry) => [entry.snapshotId, entry]));

  return Object.fromEntries(
    snapshotOptions.map((option) => [
      option.snapshot.id,
      {
        enabled: false,
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
  if (!state.enabled) {
    return "Not included in the next import.";
  }

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
  activeSourceSnapshotIds,
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
  const [showSnapshotChooser, setShowSnapshotChooser] = useState<Record<string, boolean>>({});
  const [selectionState, setSelectionState] = useState(() =>
    getInitialSelectionState(
      snapshotOptions,
      activeSourceSnapshotIds,
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
      enabled: boolean;
      importMode: ImportMode;
      selectedCompanyIds: string[];
    }) => {
      enabled: boolean;
      importMode: ImportMode;
      selectedCompanyIds: string[];
    },
  ) {
    setSelectionState((current) => {
      const previousState = current[snapshotId] ?? {
        enabled: false,
        importMode: "all" as const,
        selectedCompanyIds: [],
      };
      const nextState = updater(previousState);

      if (
        previousState.enabled === nextState.enabled &&
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

  function toggleSnapshotChooser(recipeId: string) {
    setShowSnapshotChooser((current) => ({
      ...current,
      [recipeId]: !current[recipeId],
    }));
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
            disabled={currentOrganizationCount === 0}
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

          {snapshotGroups.map((group) => (
            <section key={group.recipeId} className="card stack">
              {(() => {
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
                const activeSnapshotLabel =
                  option.snapshot.id === group.snapshots[0]?.snapshot.id
                    ? "Latest"
                    : option.snapshot.id.slice(0, 8);

                return (
                  <>
                    <div
                      className={`snapshot-recipe-tile${state.enabled ? " active" : ""}`}
                      onClick={() =>
                        updateSnapshotState(option.snapshot.id, (current) => ({
                          enabled: !current.enabled,
                          importMode: "all",
                          selectedCompanyIds: [],
                        }))
                      }
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          updateSnapshotState(option.snapshot.id, (current) => ({
                            enabled: !current.enabled,
                            importMode: "all",
                            selectedCompanyIds: [],
                          }));
                        }
                      }}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="snapshot-group-header-row">
                        <div className="heading-with-tip snapshot-card-header-inline">
                          <h2>{group.recipeName}</h2>
                          <span className="badge">Company recipe</span>
                        </div>
                        <div className="snapshot-card-header-actions">
                          <span className="meta">
                            {option.snapshot.result.rows.length} companies
                          </span>
                          {group.snapshots.length > 1 ? (
                            <div
                              className="snapshot-select-inline"
                              onClick={(event) => event.stopPropagation()}
                            >
                              <button
                                className="snapshot-select-button"
                                onClick={() => toggleSnapshotChooser(group.recipeId)}
                                type="button"
                              >
                                Snapshot: {activeSnapshotLabel}
                              </button>
                              {showSnapshotChooser[group.recipeId] ? (
                                <div className="snapshot-choice-menu">
                                  {group.snapshots.map((snapshotOption, index) => (
                                    <button
                                      key={snapshotOption.snapshot.id}
                                      className={`snapshot-choice-item${
                                        snapshotOption.snapshot.id === option.snapshot.id
                                          ? " active"
                                          : ""
                                      }`}
                                      onClick={() => {
                                        updateActiveSnapshot(group.recipeId, snapshotOption.snapshot.id);
                                        setShowSnapshotChooser((current) => ({
                                          ...current,
                                          [group.recipeId]: false,
                                        }));
                                      }}
                                      type="button"
                                    >
                                      <span>
                                        {index === 0 ? "Latest" : `Older ${index}`} ·{" "}
                                        {snapshotOption.snapshot.id.slice(0, 8)}
                                      </span>
                                      <span className="meta">
                                        {snapshotOption.snapshot.result.rows.length} companies
                                      </span>
                                    </button>
                                  ))}
                                </div>
                              ) : null}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    {state.enabled ? (
                      <>
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
                      </>
                    ) : null}
                  </>
                );
              })()}
            </section>
          ))}
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
