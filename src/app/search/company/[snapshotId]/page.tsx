import Link from "next/link";
import { CompanySearchWarning } from "@/features/company-search/components/company-search-warning";
import { RecipeList } from "@/features/recipes/components/recipe-list";
import { CompanySnapshotPreview } from "@/features/search-workspace/components/company-snapshot-preview";
import { WorkspaceEmptyState } from "@/features/search-workspace/components/workspace-empty-state";
import { WorkspaceStageNav } from "@/features/search-workspace/components/workspace-stage-nav";
import {
  buildSearchWorkspaceQuery,
  parseSearchWorkspaceContext,
} from "@/features/search-workspace/lib/workspace-route-state";
import { getCompanySnapshotById } from "@/lib/db/repositories/company-snapshots";
import { getRecipeById, listRecipesByType } from "@/lib/db/repositories/recipes";

type CompanySnapshotReviewPageProps = {
  params: Promise<{ snapshotId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CompanySnapshotReviewPage({
  params,
  searchParams,
}: CompanySnapshotReviewPageProps) {
  const { snapshotId } = await params;
  const query = searchParams ? await searchParams : {};
  const context = parseSearchWorkspaceContext("company", query);

  const [companyRecipes, peopleRecipes, snapshot] = await Promise.all([
    listRecipesByType("company"),
    listRecipesByType("people"),
    getCompanySnapshotById(snapshotId),
  ]);

  if (!snapshot) {
    return (
      <main className="shell workspace-shell">
        <WorkspaceEmptyState
          eyebrow="Company workflow"
          title="Company snapshot not found."
          description="Open a saved company snapshot from the company workflow to review it here."
          primaryAction={{ href: "/search/company", label: "Back to company workflow" }}
        />
      </main>
    );
  }

  const [selectedCompanyRecipe, selectedPeopleRecipe] = await Promise.all([
    context.companyRecipeId ? getRecipeById(context.companyRecipeId) : Promise.resolve(null),
    context.peopleRecipeId ? getRecipeById(context.peopleRecipeId) : Promise.resolve(null),
  ]);

  const companyRecipe =
    selectedCompanyRecipe?.type === "company" ? selectedCompanyRecipe : null;
  const peopleRecipe =
    selectedPeopleRecipe?.type === "people" ? selectedPeopleRecipe : null;

  return (
    <main className="shell workspace-shell">
      <section className="workspace-panel search-hero">
        <div className="workspace-header">
          <p className="eyebrow">Company snapshot review</p>
          <h1>Review one company snapshot as a first-class record.</h1>
          <p>This route is for warnings, exact params, and company selection only.</p>
          <WorkspaceStageNav current="company" />
        </div>
      </section>
      <div className="workspace-grid workspace-grid-wide search-grid">
        <div className="stack search-sidebar">
          <RecipeList
            activeRecipeId={companyRecipe?.id ?? snapshot.recipeId}
            basePath="/search/company"
            pairedRecipeId={peopleRecipe?.id ?? null}
            recipes={companyRecipes}
            type="company"
          />
          <RecipeList
            activeRecipeId={peopleRecipe?.id ?? null}
            basePath="/search/company"
            pairedRecipeId={companyRecipe?.id ?? snapshot.recipeId}
            recipes={peopleRecipes}
            type="people"
          />
        </div>
        <div className="stack search-main">
          <div className="card stack">
            <div className="workspace-header">
              <p className="eyebrow">Snapshot context</p>
              <h2>Snapshot {snapshot.id.slice(0, 8)}</h2>
              <p>
                Use this review page to inspect the saved Apollo result and choose companies for a later people-recipe import.
              </p>
            </div>
            <div className="workspace-actions">
              <Link
                className="secondary-button"
                href={`/search/company?${buildSearchWorkspaceQuery({
                  workflow: "company",
                  companyRecipeId: companyRecipe?.id ?? snapshot.recipeId,
                  peopleRecipeId: peopleRecipe?.id ?? null,
                  companySnapshotId: snapshot.id,
                })}`}
              >
                Back to company workflow
              </Link>
              <Link
                className="secondary-button"
                href={`/search/people?${buildSearchWorkspaceQuery({
                  workflow: "people",
                  companyRecipeId: companyRecipe?.id ?? snapshot.recipeId,
                  peopleRecipeId: peopleRecipe?.id ?? null,
                  sourceSnapshotIds: [snapshot.id],
                })}`}
              >
                Use in people workflow
              </Link>
            </div>
          </div>
          <CompanySearchWarning warnings={snapshot.result.warnings} />
          <CompanySnapshotPreview selectable snapshot={snapshot} />
        </div>
      </div>
    </main>
  );
}
