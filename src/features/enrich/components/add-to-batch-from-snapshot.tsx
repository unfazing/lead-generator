"use client";

import { useMemo, useState } from "react";
import { addSnapshotPeopleToBatchAction } from "@/app/recipes/actions";
import { PeopleResultsTable } from "@/features/people-search/components/people-results-table";
import {
  RecipeSnapshotChooser,
} from "@/features/search-workspace/components/recipe-snapshot-chooser";
import { InfoTip } from "@/features/ui/components/info-tip";
import type { PeopleSnapshotRecord } from "@/lib/db/repositories/people-snapshots";

type AddToBatchFromSnapshotProps = {
  activeBatchId: string | null;
  recipes: Array<{ id: string; name: string }>;
  snapshots: PeopleSnapshotRecord[];
};

export function AddToBatchFromSnapshot({
  activeBatchId,
  recipes,
  snapshots,
}: AddToBatchFromSnapshotProps) {
  const snapshotGroups = useMemo(
    () =>
      recipes
        .map((recipe) => ({
          recipeId: recipe.id,
          recipeName: recipe.name,
          snapshots: snapshots.filter((snapshot) => snapshot.peopleRecipeId === recipe.id),
        }))
        .filter((group) => group.snapshots.length > 0),
    [recipes, snapshots],
  );

  const [activeSnapshotIds, setActiveSnapshotIds] = useState<Record<string, string>>({});
  const [selectedRecipeIds, setSelectedRecipeIds] = useState<string[]>([]);
  const [expandedRecipeIds, setExpandedRecipeIds] = useState<string[]>([]);
  const [selectionState, setSelectionState] = useState<
    Record<string, { selectedApolloIds: string[] }>
  >({});

  function areStringArraysEqual(left: string[], right: string[]) {
    return (
      left.length === right.length &&
      left.every((value, index) => value === right[index])
    );
  }

  return (
    <section className="card stack">
      <div className="workspace-header">
        <p className="eyebrow">Add from saved people snapshots</p>
        <div className="column-picker-header">
          <h2 className="heading-with-tip">
            <span>Choose source people, then add them into a batch.</span>
            <InfoTip
              content="This tool only accepts people already present in saved people snapshots. Batch membership dedupes by Apollo person ID while preserving every source snapshot reference."
              label="Add from snapshots help"
            />
          </h2>
        </div>
      </div>
      {snapshots.length === 0 ? (
        <div className="empty-message">
          No saved people snapshots yet. Run people search first, then come back here
          to add reviewed people into a contact batch.
        </div>
      ) : (
        <div className="stack">
          <RecipeSnapshotChooser
            activeSnapshotIds={activeSnapshotIds}
            expandedRecipeIds={expandedRecipeIds}
            groups={snapshotGroups.map((group) => ({
              recipeId: group.recipeId,
              recipeName: group.recipeName,
              recipeLabel: "People recipe",
              snapshots: group.snapshots.map((snapshot) => ({
                id: snapshot.id,
                count: snapshot.result.rows.length,
              })),
              countLabel: "people",
            }))}
            selectedRecipeIds={selectedRecipeIds}
            onAddRecipe={(recipeId) => {
              setSelectedRecipeIds((current) => [...current, recipeId]);
            }}
            onRemoveRecipe={(recipeId) => {
              const snapshotId =
                activeSnapshotIds[recipeId] ??
                snapshotGroups.find((group) => group.recipeId === recipeId)?.snapshots[0]
                  ?.id;
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
            onSelectSnapshot={(recipeId, snapshotId) => {
              setActiveSnapshotIds((current) => ({
                ...current,
                [recipeId]: snapshotId,
              }));
              setSelectionState((current) => ({
                ...current,
                [snapshotId]: current[snapshotId] ?? {
                  selectedApolloIds: [],
                },
              }));
            }}
            onToggleExpanded={(recipeId) => {
              const activeSnapshotId =
                activeSnapshotIds[recipeId] ??
                snapshotGroups.find((group) => group.recipeId === recipeId)?.snapshots[0]
                  ?.id;
              if (!activeSnapshotId) {
                return;
              }
              setSelectionState((current) => ({
                ...current,
                [activeSnapshotId]: current[activeSnapshotId] ?? {
                  selectedApolloIds: [],
                },
              }));
              setExpandedRecipeIds((current) =>
                current.includes(recipeId)
                  ? current.filter((currentRecipeId) => currentRecipeId !== recipeId)
                  : [...current, recipeId],
              );
            }}
          />

          {snapshotGroups.map((group) => {
            const activeSnapshotId =
              activeSnapshotIds[group.recipeId] ?? group.snapshots[0]?.id ?? null;
            const activeSnapshot = activeSnapshotId
              ? group.snapshots.find((snapshot) => snapshot.id === activeSnapshotId) ?? null
              : null;
            const state = activeSnapshotId
              ? selectionState[activeSnapshotId] ?? {
                  selectedApolloIds: [],
                }
              : null;

            if (
              !activeSnapshot ||
              !state ||
              !selectedRecipeIds.includes(group.recipeId) ||
              !expandedRecipeIds.includes(group.recipeId)
            ) {
              return null;
            }

            return (
              <section key={`${group.recipeId}-${activeSnapshot.id}`} className="stack">
                <PeopleResultsTable
                  onSelectionChange={(nextSelectedApolloIds) =>
                    setSelectionState((current) => {
                      const previous = current[activeSnapshot.id] ?? {
                        selectedApolloIds: [],
                      };

                      if (
                        areStringArraysEqual(
                          previous.selectedApolloIds,
                          nextSelectedApolloIds,
                        )
                      ) {
                        return current;
                      }

                      return {
                        ...current,
                        [activeSnapshot.id]: {
                          selectedApolloIds: nextSelectedApolloIds,
                        },
                      };
                    })
                  }
                  selectable
                  snapshot={activeSnapshot}
                />
                <form action={addSnapshotPeopleToBatchAction} className="workspace-actions">
                  <input name="peopleSnapshotId" type="hidden" value={activeSnapshot.id} />
                  <input name="destinationMode" type="hidden" value="existing" />
                  <input name="batchId" type="hidden" value={activeBatchId ?? ""} />
                  <input
                    name="selectedApolloIds"
                    type="hidden"
                    value={JSON.stringify(state.selectedApolloIds)}
                  />
                  <button
                    className="primary-button"
                    disabled={state.selectedApolloIds.length === 0 || !activeBatchId}
                    name="mode"
                    type="submit"
                    value="selected"
                  >
                    Add selected people to batch
                  </button>
                  <button
                    className="secondary-button"
                    disabled={!activeBatchId}
                    name="mode"
                    type="submit"
                    value="all"
                  >
                    Add all people in snapshot to batch
                  </button>
                </form>
              </section>
            );
          })}
        </div>
      )}
    </section>
  );
}
