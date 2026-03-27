import { CompanySearchPanel } from "@/features/company-search/components/company-search-panel";
import { SavedCompanySnapshotsPanel } from "@/features/company-search/components/saved-company-snapshots-panel";
import { RecipeEditor } from "@/features/recipes/components/recipe-editor";
import { RecipeList } from "@/features/recipes/components/recipe-list";
import { getCompanyRecipeDraft } from "@/features/recipes/lib/recipe-form";
import { WorkspaceEmptyState } from "@/features/search-workspace/components/workspace-empty-state";
import { WorkspaceStageNav } from "@/features/search-workspace/components/workspace-stage-nav";
import {
  buildSearchWorkspaceQuery,
  parseSearchWorkspaceContext,
} from "@/features/search-workspace/lib/workspace-route-state";
import { listSnapshotsForRecipe } from "@/lib/db/repositories/company-snapshots";
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

export default async function CompanySearchPage({ searchParams }: SearchPageProps) {
  const params = searchParams ? await searchParams : {};
  const editorParam = getSingleParam(params, "editorMode");
  const editorMode =
    editorParam === "new" || editorParam === "edit" ? editorParam : "view";
  const context = parseSearchWorkspaceContext("company", params);

  const companyRecipes = await listRecipesByType("company");

  const selectedCompanyRecipe = context.companyRecipeId
    ? await getRecipeById(context.companyRecipeId)
    : null;

  const companyRecipe =
    selectedCompanyRecipe?.type === "company" ? selectedCompanyRecipe : null;
  const companyDraft = getCompanyRecipeDraft(
    editorMode === "new" ? null : companyRecipe,
  );
  const snapshots = companyRecipe ? await listSnapshotsForRecipe(companyRecipe.id) : [];
  const closeHref = companyRecipe
    ? `/search/company?${buildSearchWorkspaceQuery({
        workflow: "company",
        companyRecipeId: companyRecipe.id,
      })}`
    : "/search/company";

  return (
    <main className="shell workspace-shell">
      <section className="workspace-panel search-hero">
        <div className="workspace-header">
          <p className="eyebrow">Company workflow</p>
          <h1>Pick a company recipe, then run or reopen a snapshot.</h1>
          <p>Filters stay on the recipe. This route only loads the recipe you name and the snapshot you choose.</p>
          <WorkspaceStageNav current="company" />
        </div>
      </section>
      <div className="workspace-grid workspace-grid-wide search-grid">
        <div className="stack search-sidebar">
          <RecipeList
            activeRecipeId={companyRecipe?.id ?? null}
            basePath="/search/company"
            createHref="/search/company?editorMode=new"
            editorBasePath="/search/company"
            editorMode={editorMode}
            pairedRecipeId={null}
            recipes={companyRecipes}
            type="company"
          />
        </div>
        <div className="stack search-main">
          {editorMode === "new" || (editorMode === "edit" && companyRecipe) ? (
            <RecipeEditor
              closeHref={closeHref}
              draft={companyDraft}
              pairedRecipeId={null}
              recipe={editorMode === "new" ? null : companyRecipe}
              returnBasePath="/search/company"
              type="company"
            />
          ) : companyRecipes.length === 0 ? (
            <WorkspaceEmptyState
              eyebrow="Company workflow"
              title="Save a company recipe to start."
              description="Company search runs from saved Apollo filters. Create one recipe, then return here to run or reopen snapshots."
            />
          ) : !companyRecipe ? (
            <WorkspaceEmptyState
              eyebrow="Company workflow"
              title="Choose a company recipe."
              description="This route stays empty until you explicitly select a saved company recipe from the sidebar."
            />
          ) : (
            <>
              <CompanySearchPanel
                recipe={companyRecipe}
              />
              <SavedCompanySnapshotsPanel
                initialSnapshotId={context.companySnapshotId ?? null}
                snapshots={snapshots}
              />
            </>
          )}
        </div>
      </div>
    </main>
  );
}
