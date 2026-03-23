import { CompanyColumnPicker } from "@/features/company-search/components/company-column-picker";
import { CompanyResultsTable } from "@/features/company-search/components/company-results-table";
import { CompanySearchPanel } from "@/features/company-search/components/company-search-panel";
import { CompanySearchWarning } from "@/features/company-search/components/company-search-warning";
import { RecipeEditor } from "@/features/recipes/components/recipe-editor";
import { RecipeList } from "@/features/recipes/components/recipe-list";
import { UsageSummary } from "@/features/usage/components/usage-summary";
import { getRecipeDraft } from "@/features/recipes/lib/recipe-form";
import { getApolloUsageSummary } from "@/features/usage/lib/apollo-usage";
import { defaultOptionalCompanyColumns } from "@/lib/apollo/company-filter-definitions";
import { listSnapshotsForRecipe } from "@/lib/db/repositories/company-snapshots";
import { getRecipeById, listRecipes } from "@/lib/db/repositories/recipes";

type RecipesPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function RecipesPage({ searchParams }: RecipesPageProps) {
  const params = searchParams ? await searchParams : {};
  const recipeId =
    typeof params.recipe === "string"
      ? params.recipe
      : Array.isArray(params.recipe)
        ? params.recipe[0]
        : null;

  const snapshotId =
    typeof params.snapshot === "string"
      ? params.snapshot
      : Array.isArray(params.snapshot)
        ? params.snapshot[0]
        : null;

  const recipes = await listRecipes();
  const selectedRecipe = recipeId ? await getRecipeById(recipeId) : recipes[0] ?? null;
  const draft = getRecipeDraft(selectedRecipe);
  const usageSummary = await getApolloUsageSummary();
  const snapshots = selectedRecipe
    ? await listSnapshotsForRecipe(selectedRecipe.id)
    : [];
  const activeSnapshot =
    (snapshotId
      ? snapshots.find((snapshot) => snapshot.id === snapshotId)
      : snapshots[0]) ?? null;

  return (
    <main className="shell workspace-shell">
      <section className="workspace-panel">
        <div className="workspace-header">
          <p className="eyebrow">Search workspace</p>
          <h1>Build narrow Apollo searches before you spend.</h1>
          <p>
            Keep saved filters, company snapshots, and usage visibility in one
            operator-first workspace so every search run is deliberate.
          </p>
        </div>
      </section>
      <div className="workspace-grid">
        <RecipeList activeRecipeId={selectedRecipe?.id ?? null} recipes={recipes} />
        <div className="stack">
          <UsageSummary summary={usageSummary} />
          <CompanySearchPanel recipe={selectedRecipe} snapshot={activeSnapshot} />
          <CompanySearchWarning warnings={activeSnapshot?.result.warnings ?? []} />
          <CompanyColumnPicker
            allColumns={
              activeSnapshot?.result.availableColumns ?? [...defaultOptionalCompanyColumns]
            }
            selectedColumns={activeSnapshot?.result.availableColumns ?? []}
          />
          <CompanyResultsTable snapshot={activeSnapshot} />
          <RecipeEditor draft={draft} recipe={selectedRecipe} />
        </div>
      </div>
    </main>
  );
}
