import Link from "next/link";
import { PeopleSearchPanel } from "@/features/people-search/components/people-search-panel";
import { RecipeEditor } from "@/features/recipes/components/recipe-editor";
import { RecipeList } from "@/features/recipes/components/recipe-list";
import { getPeopleRecipeDraft } from "@/features/recipes/lib/recipe-form";
import { WorkspaceEmptyState } from "@/features/search-workspace/components/workspace-empty-state";
import { WorkspaceStageNav } from "@/features/search-workspace/components/workspace-stage-nav";
import { summarizeSnapshotParams } from "@/features/search-workspace/lib/snapshot-param-summary";
import {
  buildSearchWorkspaceQuery,
  parseSearchWorkspaceContext,
} from "@/features/search-workspace/lib/workspace-route-state";
import type { CompanySnapshotRecord } from "@/lib/db/repositories/company-snapshots";
import { listSnapshotsForRecipe } from "@/lib/db/repositories/company-snapshots";
import { listPeopleSnapshotsForRecipe } from "@/lib/db/repositories/people-snapshots";
import { getRecipeById, listRecipesByType } from "@/lib/db/repositories/recipes";

type SearchPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getSingleParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = params[key];
  return typeof value === "string" ? value : Array.isArray(value) ? value[0] : null;
}

type SnapshotOption = {
  recipeId: string;
  recipeName: string;
  snapshot: CompanySnapshotRecord;
};

export default async function PeopleSearchPage({ searchParams }: SearchPageProps) {
  const params = searchParams ? await searchParams : {};
  const editorParam = getSingleParam(params, "editorMode");
  const editorMode =
    editorParam === "new" || editorParam === "edit" ? editorParam : "view";
  const context = parseSearchWorkspaceContext("people", params);
  const peopleRecipes = await listRecipesByType("people");
  const selectedPeopleRecipe = context.peopleRecipeId
    ? await getRecipeById(context.peopleRecipeId)
    : null;
  const peopleRecipe =
    selectedPeopleRecipe?.type === "people" ? selectedPeopleRecipe : null;
  const peopleDraft = getPeopleRecipeDraft(
    editorMode === "new" ? null : peopleRecipe,
  );
  const peopleSnapshots = peopleRecipe
    ? await listPeopleSnapshotsForRecipe(peopleRecipe.id)
    : [];

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

  const activeSourceSnapshotIds = context.sourceSnapshotIds;
  const closeHref = peopleRecipe
    ? `/search/people?${buildSearchWorkspaceQuery({
        workflow: "people",
        peopleRecipeId: peopleRecipe.id,
        sourceSnapshotIds: activeSourceSnapshotIds,
      })}`
    : "/search/people";

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
          <RecipeList
            activeRecipeId={peopleRecipe?.id ?? null}
            basePath="/search/people"
            createHref={`/search/people?${
              buildSearchWorkspaceQuery({
                workflow: "people",
                sourceSnapshotIds: activeSourceSnapshotIds,
              })
            }${activeSourceSnapshotIds.length > 0 ? "&" : ""}editorMode=new`}
            editorBasePath="/search/people"
            editorMode={editorMode}
            extraQuery={{ sourceSnapshot: activeSourceSnapshotIds }}
            pairedRecipeId={null}
            recipes={peopleRecipes}
            type="people"
          />
        </div>
        <div className="stack search-main">
          {peopleRecipes.length === 0 ? (
            <WorkspaceEmptyState
              eyebrow="People workflow"
              title="Save a people recipe to continue."
              description="People search runs from saved filters and a selected company snapshot source."
            />
          ) : editorMode === "new" || (editorMode === "edit" && peopleRecipe) ? (
            <RecipeEditor
              closeHref={closeHref}
              draft={peopleDraft}
              pairedRecipeId={null}
              recipe={editorMode === "new" ? null : peopleRecipe}
              returnBasePath="/search/people"
              returnSourceSnapshotIds={activeSourceSnapshotIds}
              type="people"
            />
          ) : !peopleRecipe ? (
            <WorkspaceEmptyState
              eyebrow="People workflow"
              title="Choose a people recipe."
              description="Select one saved people recipe from the sidebar before you run people search."
            />
          ) : (
            <>
              {snapshotOptions.length === 0 ? (
                <WorkspaceEmptyState
                  eyebrow="People workflow"
                  title="No company snapshots available yet."
                  description="Company snapshots are the import source for people recipes. Create one in the company workflow first."
                  primaryAction={{ href: "/search/company", label: "Open company workflow" }}
                />
              ) : (
                <PeopleSearchPanel
                  key={`${peopleRecipe.id}:${activeSourceSnapshotIds.join(",")}`}
                  activeSourceSnapshotIds={activeSourceSnapshotIds}
                  peopleRecipe={peopleRecipe}
                  snapshotOptions={snapshotOptions}
                />
              )}

              <section className="card stack">
                <div className="workspace-header">
                  <p className="eyebrow">Saved people snapshots</p>
                  <h2>Reopen reviewed people snapshots for this recipe.</h2>
                </div>
                {peopleSnapshots.length === 0 ? (
                  <div className="empty-message">
                    No people snapshots yet. Run people search from this recipe to create one.
                  </div>
                ) : (
                  <div className="recipe-list">
                    {peopleSnapshots.map((snapshot) => {
                      const paramSummary = summarizeSnapshotParams(snapshot.recipeParams);
                      const href = `/search/people/${snapshot.id}?${buildSearchWorkspaceQuery({
                        workflow: "people",
                        peopleRecipeId: peopleRecipe.id,
                        sourceSnapshotIds: snapshot.organizationImports.map(
                          (entry) => entry.snapshotId,
                        ),
                      })}`;

                      return (
                        <div
                          key={snapshot.id}
                          className={`recipe-list-item snapshot-list-item${
                            context.peopleSnapshotId === snapshot.id ? " active" : ""
                          }`}
                        >
                          <Link className="recipe-list-link" href={href}>
                            <strong>{snapshot.result.rows.length} people</strong>
                            <span className="meta">
                              {new Date(snapshot.updatedAt).toLocaleDateString()} · {snapshot.organizationImports.length} source(s) · {snapshot.id.slice(0, 8)}
                            </span>
                          </Link>
                          {paramSummary.length > 0 ? (
                            <details className="snapshot-param-disclosure">
                              <summary className="meta">Show params</summary>
                              <div className="snapshot-param-summary">
                                {paramSummary.map((entry) => (
                                  <span
                                    key={`${snapshot.id}-${entry}`}
                                    className="meta"
                                  >
                                    {entry}
                                  </span>
                                ))}
                              </div>
                            </details>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
