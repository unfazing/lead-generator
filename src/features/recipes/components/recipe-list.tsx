import Link from "next/link";
import type { Recipe } from "@/lib/recipes/schema";

type RecipeListProps = {
  recipes: Recipe[];
  activeRecipeId: string | null;
};

export function RecipeList({ recipes, activeRecipeId }: RecipeListProps) {
  return (
    <aside className="stack">
      <div className="card">
        <div className="workspace-actions">
          <span className="badge">{recipes.length} saved recipe(s)</span>
          <Link className="secondary-button" href="/recipes">
            New recipe
          </Link>
        </div>
      </div>
      <div className="recipe-list">
        {recipes.length === 0 ? (
          <div className="card empty-message">
            No saved recipes yet. Start with a named workflow you expect to reuse.
          </div>
        ) : null}
        {recipes.map((recipe) => {
          const isActive = recipe.id === activeRecipeId;

          return (
            <Link
              key={recipe.id}
              className={`recipe-list-item${isActive ? " active" : ""}`}
              href={`/recipes?recipe=${recipe.id}`}
            >
              <strong>{recipe.name}</strong>
              <span className="meta">
                {recipe.companyFilters.qOrganizationKeywordTags.length} company keywords •{" "}
                {recipe.peopleFilters.titles.length} people titles
              </span>
              <span className="meta">
                Updated {new Date(recipe.updatedAt).toLocaleDateString()}
              </span>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
