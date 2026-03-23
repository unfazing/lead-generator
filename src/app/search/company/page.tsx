import Link from "next/link";
import { CompanySearchWarning } from "@/features/company-search/components/company-search-warning";
import { CompanySearchPanel } from "@/features/company-search/components/company-search-panel";
import { RecipeEditor } from "@/features/recipes/components/recipe-editor";
import { RecipeList } from "@/features/recipes/components/recipe-list";
import { getCompanyRecipeDraft } from "@/features/recipes/lib/recipe-form";
import { WorkspaceEmptyState } from "@/features/search-workspace/components/workspace-empty-state";
import { WorkspaceStageNav } from "@/features/search-workspace/components/workspace-stage-nav";
import { summarizeSnapshotParams } from "@/features/search-workspace/lib/snapshot-param-summary";
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
  const activeSnapshot = context.companySnapshotId
    ? snapshots.find((snapshot) => snapshot.id === context.companySnapshotId) ?? null
    : null;
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
          {companyRecipes.length === 0 ? (
            <WorkspaceEmptyState
              eyebrow="Company workflow"
              title="Save a company recipe to start."
              description="Company search runs from saved Apollo filters. Create one recipe, then return here to run or reopen snapshots."
            />
          ) : editorMode === "new" || (editorMode === "edit" && companyRecipe) ? (
            <RecipeEditor
              closeHref={closeHref}
              draft={companyDraft}
              pairedRecipeId={null}
              recipe={editorMode === "new" ? null : companyRecipe}
              returnBasePath="/search/company"
              type="company"
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
                snapshot={activeSnapshot}
              />
              <CompanySearchWarning warnings={activeSnapshot?.result.warnings ?? []} />
              <section className="card stack">
                <div className="workspace-header">
                  <p className="eyebrow">Saved company snapshots</p>
                  <h2>Open a company snapshot to review and select companies.</h2>
                </div>
                {snapshots.length === 0 ? (
                  <div className="empty-message">
                    No snapshots yet. Run a live company search or reopen a stored snapshot to create one.
                  </div>
                ) : (
                  <div className="recipe-list">
                    {snapshots.map((snapshot) => {
                      const paramSummary = summarizeSnapshotParams(snapshot.recipeParams);
                      const href = `/search/company/${snapshot.id}?${buildSearchWorkspaceQuery({
                        workflow: "company",
                        companyRecipeId: companyRecipe.id,
                      })}`;

                      return (
                        <div
                          key={snapshot.id}
                          className={`recipe-list-item snapshot-list-item${
                            snapshot.id === activeSnapshot?.id ? " active" : ""
                          }`}
                        >
                          <Link className="recipe-list-link" href={href}>
                            <strong>{snapshot.result.rows.length} companies</strong>
                            <span className="meta">
                              {new Date(snapshot.updatedAt).toLocaleDateString()} · {snapshot.id.slice(0, 8)}
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
