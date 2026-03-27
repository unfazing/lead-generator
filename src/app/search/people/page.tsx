import { PeopleSearchPanel } from "@/features/people-search/components/people-search-panel";
import { SavedPeopleSnapshotsPanel } from "@/features/people-search/components/saved-people-snapshots-panel";
import { RecipeEditor } from "@/features/recipes/components/recipe-editor";
import { RecipeList } from "@/features/recipes/components/recipe-list";
import { getPeopleRecipeDraft } from "@/features/recipes/lib/recipe-form";
import { WorkspaceEmptyState } from "@/features/search-workspace/components/workspace-empty-state";
import { WorkspaceStageNav } from "@/features/search-workspace/components/workspace-stage-nav";
import {
  buildSearchWorkspaceQuery,
  parseSearchWorkspaceContext,
} from "@/features/search-workspace/lib/workspace-route-state";
import type { CompanySnapshotRecord } from "@/lib/db/repositories/company-snapshots";
import { listSnapshotsForRecipe } from "@/lib/db/repositories/company-snapshots";
import { listPeopleSnapshotsForRecipe } from "@/lib/db/repositories/people-snapshots";
import { getRetrievalRunById } from "@/lib/db/repositories/retrieval-runs";
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

type SnapshotGroup = {
  recipeId: string;
  recipeName: string;
  snapshots: SnapshotOption[];
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
  const activeRetrievalRun = context.retrievalRunId
    ? await getRetrievalRunById(context.retrievalRunId)
    : null;
  const peopleSnapshots = peopleRecipe
    ? await listPeopleSnapshotsForRecipe(peopleRecipe.id)
    : [];
  const initialPeopleSnapshotId = activeRetrievalRun?.peopleSnapshotId ?? null;
  const companyRecipes = await listRecipesByType("company");
  const snapshotGroups = await Promise.all(
    companyRecipes.map(async (recipe) => ({
      recipe,
      snapshots: await listSnapshotsForRecipe(recipe.id),
    })),
  );

  const snapshotOptions = snapshotGroups
    .filter(({ snapshots }) => snapshots.length > 0)
    .map<SnapshotGroup>(({ recipe, snapshots }) => ({
      recipeId: recipe.id,
      recipeName: recipe.name,
      snapshots: snapshots.map((snapshot) => ({
        recipeId: recipe.id,
        recipeName: recipe.name,
        snapshot,
      })),
    }));

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
          <h1>Choose a people recipe, then add companies to it.</h1>
          <p>Use saved company snapshots to help choose companies, apply them to the recipe, then run people search when you are ready.</p>
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
              description="People search runs from a saved recipe after you choose which companies to add to it."
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
              description="Select one saved people recipe from the sidebar before you add companies or run people search."
            />
          ) : (
            <>
              {snapshotOptions.length === 0 ? (
                <WorkspaceEmptyState
                  eyebrow="People workflow"
                  title="No company snapshots available yet."
                  description="Use the company workflow to create a company snapshot, then come back here to choose companies from it."
                  primaryAction={{ href: "/search/company", label: "Open company workflow" }}
                />
              ) : (
                <PeopleSearchPanel
                  key={`${peopleRecipe.id}:${activeSourceSnapshotIds.join(",")}`}
                  peopleRecipe={peopleRecipe}
                  snapshotGroups={snapshotOptions}
                />
              )}
              <SavedPeopleSnapshotsPanel
                initialSnapshotId={initialPeopleSnapshotId}
                snapshots={peopleSnapshots}
              />
            </>
          )}
        </div>
      </div>
    </main>
  );
}
