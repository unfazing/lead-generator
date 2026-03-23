import Link from "next/link";
import { CompanySearchWarning } from "@/features/company-search/components/company-search-warning";
import { CompanySearchPanel } from "@/features/company-search/components/company-search-panel";
import { RecipeList } from "@/features/recipes/components/recipe-list";
import { WorkspaceEmptyState } from "@/features/search-workspace/components/workspace-empty-state";
import { WorkspaceStageNav } from "@/features/search-workspace/components/workspace-stage-nav";
import {
  buildSearchWorkspaceQuery,
  parseSearchWorkspaceContext,
} from "@/features/search-workspace/lib/workspace-route-state";
import { UsageSummary } from "@/features/usage/components/usage-summary";
import { getApolloUsageSummary } from "@/features/usage/lib/apollo-usage";
import { listSnapshotsForRecipe } from "@/lib/db/repositories/company-snapshots";
import { getRecipeById, listRecipesByType } from "@/lib/db/repositories/recipes";

type SearchPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CompanySearchPage({ searchParams }: SearchPageProps) {
  const params = searchParams ? await searchParams : {};
  const context = parseSearchWorkspaceContext("company", params);

  const [companyRecipes, peopleRecipes, usageSummary] = await Promise.all([
    listRecipesByType("company"),
    listRecipesByType("people"),
    getApolloUsageSummary(),
  ]);

  const [selectedCompanyRecipe, selectedPeopleRecipe] = await Promise.all([
    context.companyRecipeId ? getRecipeById(context.companyRecipeId) : Promise.resolve(null),
    context.peopleRecipeId ? getRecipeById(context.peopleRecipeId) : Promise.resolve(null),
  ]);

  const companyRecipe =
    selectedCompanyRecipe?.type === "company" ? selectedCompanyRecipe : null;
  const peopleRecipe =
    selectedPeopleRecipe?.type === "people" ? selectedPeopleRecipe : null;
  const snapshots = companyRecipe ? await listSnapshotsForRecipe(companyRecipe.id) : [];
  const activeSnapshot = context.companySnapshotId
    ? snapshots.find((snapshot) => snapshot.id === context.companySnapshotId) ?? null
    : null;

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
            pairedRecipeId={peopleRecipe?.id ?? null}
            recipes={companyRecipes}
            type="company"
          />
          <RecipeList
            activeRecipeId={peopleRecipe?.id ?? null}
            basePath="/search/company"
            pairedRecipeId={companyRecipe?.id ?? null}
            recipes={peopleRecipes}
            type="people"
          />
        </div>
        <div className="stack search-main">
          <UsageSummary summary={usageSummary} />
          {companyRecipes.length === 0 ? (
            <WorkspaceEmptyState
              eyebrow="Company workflow"
              title="Save a company recipe to start."
              description="Company search runs from saved Apollo filters. Create one recipe, then return here to run or reopen snapshots."
              primaryAction={{ href: "/recipes/company", label: "Create company recipe" }}
            />
          ) : !companyRecipe ? (
            <WorkspaceEmptyState
              eyebrow="Company workflow"
              title="Choose a company recipe."
              description="This route stays empty until you explicitly select a saved company recipe from the sidebar."
              primaryAction={{ href: "/recipes/company", label: "Manage company recipes" }}
            />
          ) : (
            <>
              <CompanySearchPanel
                pairedPeopleRecipe={peopleRecipe}
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
                      const href = `/search/company/${snapshot.id}?${buildSearchWorkspaceQuery({
                        workflow: "company",
                        companyRecipeId: companyRecipe.id,
                        peopleRecipeId: peopleRecipe?.id ?? null,
                      })}`;

                      return (
                        <Link
                          key={snapshot.id}
                          className={`recipe-list-item${
                            snapshot.id === activeSnapshot?.id ? " active" : ""
                          }`}
                          href={href}
                        >
                          <span className="recipe-list-link">
                            <strong>{snapshot.result.rows.length} companies</strong>
                            <span className="meta">
                              Updated {new Date(snapshot.updatedAt).toLocaleDateString()}
                            </span>
                            <span className="meta">Snapshot {snapshot.id.slice(0, 8)}</span>
                          </span>
                        </Link>
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
