import Link from "next/link";
import { PeopleSearchPanel } from "@/features/people-search/components/people-search-panel";
import { PeopleResultsTable } from "@/features/people-search/components/people-results-table";
import { WorkspaceEmptyState } from "@/features/search-workspace/components/workspace-empty-state";
import { WorkspaceStageNav } from "@/features/search-workspace/components/workspace-stage-nav";
import {
  buildSearchWorkspaceQuery,
  parseSearchWorkspaceContext,
} from "@/features/search-workspace/lib/workspace-route-state";
import type { CompanySnapshotRecord } from "@/lib/db/repositories/company-snapshots";
import { listSnapshotsForRecipe } from "@/lib/db/repositories/company-snapshots";
import { listPeopleSnapshotsForContext } from "@/lib/db/repositories/people-snapshots";
import { getRecipeById, listRecipesByType } from "@/lib/db/repositories/recipes";

type SearchPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

type SnapshotOption = {
  recipeId: string;
  recipeName: string;
  snapshot: CompanySnapshotRecord;
};

export default async function PeopleSearchPage({ searchParams }: SearchPageProps) {
  const params = searchParams ? await searchParams : {};
  const context = parseSearchWorkspaceContext("people", params);
  const peopleRecipes = await listRecipesByType("people");
  const selectedPeopleRecipe = context.peopleRecipeId
    ? await getRecipeById(context.peopleRecipeId)
    : null;
  const peopleRecipe =
    selectedPeopleRecipe?.type === "people" ? selectedPeopleRecipe : null;

  const companyRecipes = await listRecipesByType("company");
  const snapshotGroups = await Promise.all(
    companyRecipes.map(async (recipe) => ({
      recipe,
      snapshots: await listSnapshotsForRecipe(recipe.id),
    })),
  );

  const snapshotOptions = snapshotGroups.flatMap<SnapshotOption>(({ recipe, snapshots }) =>
    snapshots.map((snapshot) => ({
      recipeId: recipe.id,
      recipeName: recipe.name,
      snapshot,
    })),
  );

  const activeSourceSnapshot =
    context.sourceSnapshotIds.length > 0
      ? snapshotOptions.find((option) => option.snapshot.id === context.sourceSnapshotIds[0]) ?? null
      : null;
  const peopleSnapshots =
    peopleRecipe && activeSourceSnapshot
      ? await listPeopleSnapshotsForContext(peopleRecipe.id, activeSourceSnapshot.snapshot.id)
      : [];
  const activePeopleSnapshot = context.peopleSnapshotId
    ? peopleSnapshots.find((snapshot) => snapshot.id === context.peopleSnapshotId) ?? null
    : null;

  return (
    <main className="shell workspace-shell">
      <section className="workspace-panel search-hero">
        <div className="workspace-header">
          <p className="eyebrow">People workflow</p>
          <h1>Choose a people recipe, then point it at a company snapshot.</h1>
          <p>People search only runs when you click it. Refreshing this route keeps the exact recipe and snapshot IDs in the URL.</p>
          <WorkspaceStageNav current="people" />
        </div>
      </section>
      <div className="workspace-grid workspace-grid-wide search-grid">
        <div className="stack search-sidebar">
          <section className="card recipe-rail">
            <div className="recipe-rail-header">
              <div className="workspace-header">
                <p className="eyebrow">People recipes</p>
              </div>
              <span className="badge">{peopleRecipes.length} saved</span>
            </div>
            <div className="recipe-list">
              {peopleRecipes.length === 0 ? (
                <div className="empty-message recipe-empty-state">
                  No people recipes yet. Save one before running people search.
                </div>
              ) : null}
              {peopleRecipes.map((recipe) => {
                const href = `/search/people?${buildSearchWorkspaceQuery({
                  workflow: "people",
                  companyRecipeId: activeSourceSnapshot?.recipeId ?? null,
                  peopleRecipeId: recipe.id,
                  sourceSnapshotIds: activeSourceSnapshot
                    ? [activeSourceSnapshot.snapshot.id]
                    : [],
                })}`;

                return (
                  <Link
                    key={recipe.id}
                    className={`recipe-list-item${recipe.id === peopleRecipe?.id ? " active" : ""}`}
                    href={href}
                  >
                    <span className="recipe-list-link">
                      <strong>{recipe.name}</strong>
                      <span className="meta">
                        {recipe.peopleFilters.personTitles.length} titles •{" "}
                        {recipe.peopleFilters.personSeniorities.length} seniority filters
                      </span>
                      <span className="meta">
                        Updated {new Date(recipe.updatedAt).toLocaleDateString()}
                      </span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        </div>
        <div className="stack search-main">
          <section className="card stack">
            <div className="workspace-header">
              <p className="eyebrow">Snapshot source</p>
              <h2>Pick the company snapshot that feeds this people run.</h2>
              <p>Source selection is explicit. Nothing loads until you choose a saved snapshot.</p>
            </div>
            {snapshotOptions.length === 0 ? (
              <WorkspaceEmptyState
                eyebrow="Snapshot source"
                title="No company snapshots available yet."
                description="Run a company search first, then come back here to use that snapshot as the source for people discovery."
                primaryAction={{ href: "/search/company", label: "Go to company workflow" }}
              />
            ) : (
              <div className="recipe-list">
                {snapshotOptions.map((option) => {
                  const href = `/search/people?${buildSearchWorkspaceQuery({
                    workflow: "people",
                    companyRecipeId: option.recipeId,
                    peopleRecipeId: peopleRecipe?.id ?? null,
                    sourceSnapshotIds: [option.snapshot.id],
                  })}`;

                  return (
                    <Link
                      key={option.snapshot.id}
                      className={`recipe-list-item${
                        option.snapshot.id === activeSourceSnapshot?.snapshot.id ? " active" : ""
                      }`}
                      href={href}
                    >
                      <span className="recipe-list-link">
                        <strong>{option.recipeName}</strong>
                        <span className="meta">
                          {option.snapshot.result.rows.length} companies • updated{" "}
                          {new Date(option.snapshot.updatedAt).toLocaleDateString()}
                        </span>
                        <span className="meta">Snapshot {option.snapshot.id.slice(0, 8)}</span>
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
          {peopleRecipes.length === 0 ? (
            <WorkspaceEmptyState
              eyebrow="People workflow"
              title="Save a people recipe to continue."
              description="People search runs from saved filters and a selected company snapshot source."
              primaryAction={{ href: "/recipes/people", label: "Create people recipe" }}
            />
          ) : !peopleRecipe ? (
            <WorkspaceEmptyState
              eyebrow="People workflow"
              title="Choose a people recipe."
              description="Select one saved people recipe from the sidebar before you run people search."
              primaryAction={{ href: "/recipes/people", label: "Manage people recipes" }}
            />
          ) : !activeSourceSnapshot ? (
            <WorkspaceEmptyState
              eyebrow="People workflow"
              title="Choose a source snapshot."
              description="Pick one company snapshot above to define the organization IDs that this people workflow should search against."
              secondaryAction={{ href: "/search/company", label: "Open company workflow" }}
            />
          ) : (
            <>
              <PeopleSearchPanel
                companyRecipeId={activeSourceSnapshot.recipeId}
                companySnapshot={activeSourceSnapshot.snapshot}
                peopleRecipe={peopleRecipe}
                selectedCompanyIds={[]}
              />
              <PeopleResultsTable snapshot={activePeopleSnapshot} />
            </>
          )}
        </div>
      </div>
    </main>
  );
}
