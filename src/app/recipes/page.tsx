import { RecipeEditor } from "@/features/recipes/components/recipe-editor";
import { RecipeList } from "@/features/recipes/components/recipe-list";
import { UsageSummary } from "@/features/usage/components/usage-summary";
import { getRecipeDraft } from "@/features/recipes/lib/recipe-form";
import { getApolloUsageSummary } from "@/features/usage/lib/apollo-usage";
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

  const recipes = await listRecipes();
  const selectedRecipe = recipeId ? await getRecipeById(recipeId) : recipes[0] ?? null;
  const draft = getRecipeDraft(selectedRecipe);
  const usageSummary = await getApolloUsageSummary();

  return (
    <main className="shell workspace-shell">
      <section className="workspace-panel">
        <div className="workspace-header">
          <p className="eyebrow">Phase 1 workspace</p>
          <h1>Recipes first, spend visibility always on.</h1>
          <p>
            Build durable Apollo prospecting recipes before search execution
            exists, and keep credit visibility close to the working surface.
          </p>
        </div>
      </section>
      <div className="workspace-grid">
        <RecipeList activeRecipeId={selectedRecipe?.id ?? null} recipes={recipes} />
        <div className="stack">
          <UsageSummary summary={usageSummary} />
          <RecipeEditor draft={draft} recipe={selectedRecipe} />
        </div>
      </div>
    </main>
  );
}
