"use client";

import { useMemo, useState } from "react";

type SnapshotOption = {
  id: string;
  count: number;
};

export type RecipeSnapshotChooserGroup = {
  recipeId: string;
  recipeName: string;
  recipeLabel: string;
  snapshots: SnapshotOption[];
  countLabel: string;
};

type RecipeSnapshotChooserProps = {
  activeSnapshotIds: Record<string, string>;
  expandedRecipeIds: string[];
  groups: RecipeSnapshotChooserGroup[];
  selectedRecipeIds: string[];
  onAddRecipe: (recipeId: string) => void;
  onRemoveRecipe: (recipeId: string) => void;
  onSelectSnapshot: (recipeId: string, snapshotId: string) => void;
  onToggleExpanded: (recipeId: string) => void;
};

export function RecipeSnapshotChooser({
  activeSnapshotIds,
  expandedRecipeIds,
  groups,
  selectedRecipeIds,
  onAddRecipe,
  onRemoveRecipe,
  onSelectSnapshot,
  onToggleExpanded,
}: RecipeSnapshotChooserProps) {
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showSnapshotChooser, setShowSnapshotChooser] = useState<Record<string, boolean>>(
    {},
  );

  const selectedGroups = useMemo(
    () =>
      selectedRecipeIds
        .map((recipeId) => groups.find((group) => group.recipeId === recipeId) ?? null)
        .filter((group): group is RecipeSnapshotChooserGroup => group !== null),
    [groups, selectedRecipeIds],
  );
  const availableGroups = useMemo(
    () => groups.filter((group) => !selectedRecipeIds.includes(group.recipeId)),
    [groups, selectedRecipeIds],
  );

  return (
    <section className="stack">
      <div className="workspace-actions">
        <div className="snapshot-select-inline">
          <button
            className="secondary-button"
            onClick={() => setShowAddMenu((current) => !current)}
            type="button"
          >
            Add recipe
          </button>
          {showAddMenu ? (
            <div className="snapshot-choice-menu">
              {availableGroups.length > 0 ? (
                availableGroups.map((group) => (
                  <button
                    key={group.recipeId}
                    className="snapshot-choice-item"
                    onClick={() => {
                      onAddRecipe(group.recipeId);
                      setShowAddMenu(false);
                    }}
                    type="button"
                  >
                    <span>{group.recipeName}</span>
                    <span className="meta">{group.snapshots.length} saved snapshots</span>
                  </button>
                ))
              ) : (
                <div className="empty-message">All recipes are already added.</div>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {selectedGroups.map((group) => {
        const activeSnapshotId = activeSnapshotIds[group.recipeId] ?? group.snapshots[0]?.id;
        const activeSnapshot =
          group.snapshots.find((snapshot) => snapshot.id === activeSnapshotId) ??
          group.snapshots[0];

        if (!activeSnapshot) {
          return null;
        }

        const activeSnapshotLabel =
          activeSnapshot.id === group.snapshots[0]?.id ? "Latest" : activeSnapshot.id.slice(0, 8);

        return (
          <section key={group.recipeId} className="card stack">
            <div
              className={`snapshot-recipe-tile${
                expandedRecipeIds.includes(group.recipeId) ? " active" : ""
              }`}
              onClick={() => onToggleExpanded(group.recipeId)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onToggleExpanded(group.recipeId);
                }
              }}
              role="button"
              tabIndex={0}
            >
              <div className="snapshot-group-header-row">
                <div className="heading-with-tip snapshot-card-header-inline">
                  <h2>{group.recipeName}</h2>
                  <span className="badge">{group.recipeLabel}</span>
                </div>
                <div className="snapshot-card-header-actions">
                  <span className="meta">
                    {activeSnapshot.count} {group.countLabel}
                  </span>
                  {group.snapshots.length > 1 ? (
                    <div
                      className="snapshot-select-inline"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <button
                        className="snapshot-select-button"
                        onClick={() =>
                          setShowSnapshotChooser((current) => ({
                            ...current,
                            [group.recipeId]: !current[group.recipeId],
                          }))
                        }
                        type="button"
                      >
                        Snapshot: {activeSnapshotLabel}
                      </button>
                      {showSnapshotChooser[group.recipeId] ? (
                        <div className="snapshot-choice-menu">
                          {group.snapshots.map((snapshotOption, index) => (
                            <button
                              key={snapshotOption.id}
                              className={`snapshot-choice-item${
                                snapshotOption.id === activeSnapshot.id ? " active" : ""
                              }`}
                              onClick={() => {
                                onSelectSnapshot(group.recipeId, snapshotOption.id);
                                setShowSnapshotChooser((current) => ({
                                  ...current,
                                  [group.recipeId]: false,
                                }));
                              }}
                              type="button"
                            >
                              <span>
                                {index === 0 ? "Latest" : `Older ${index}`} ·{" "}
                                {snapshotOption.id.slice(0, 8)}
                              </span>
                              <span className="meta">
                                {snapshotOption.count} {group.countLabel}
                              </span>
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                  <button
                    className="icon-button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onRemoveRecipe(group.recipeId);
                    }}
                    type="button"
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>
          </section>
        );
      })}
    </section>
  );
}
