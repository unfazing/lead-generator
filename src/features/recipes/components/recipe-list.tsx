import Link from "next/link";
import type { CompanyRecipe, PeopleRecipe, RecipeType } from "@/lib/recipes/schema";

type RecipeListProps =
  | {
      basePath: string;
      createHref?: string | null;
      type: "company";
      recipes: CompanyRecipe[];
      activeRecipeId: string | null;
      pairedRecipeId: string | null;
    }
  | {
      basePath: string;
      createHref?: string | null;
      type: "people";
      recipes: PeopleRecipe[];
      activeRecipeId: string | null;
      pairedRecipeId: string | null;
    };

export function RecipeList({
  basePath,
  createHref,
  type,
  recipes,
  activeRecipeId,
  pairedRecipeId,
}: RecipeListProps) {
  const title = type === "company" ? "Company recipes" : "People recipes";

  function getRecipeHref(recipeId: string) {
    if (type === "company") {
      return `${basePath}?companyRecipe=${recipeId}${pairedRecipeId ? `&peopleRecipe=${pairedRecipeId}` : ""}${basePath.startsWith("/recipes") ? "&editorMode=edit" : ""}`;
    }

    return `${basePath}?peopleRecipe=${recipeId}${pairedRecipeId ? `&companyRecipe=${pairedRecipeId}` : ""}${basePath.startsWith("/recipes") ? "&editorMode=edit" : ""}`;
  }

  return (
    <section className="card recipe-rail">
      <div className="recipe-rail-header">
        <div className="workspace-header">
          <p className="eyebrow">{title}</p>
        </div>
        <span className="badge">{recipes.length} saved</span>
      </div>
      {createHref ? (
        <Link className="primary-button recipe-rail-action" href={createHref}>
          {type === "company" ? "New company recipe" : "New people recipe"}
        </Link>
      ) : null}
      <div className="recipe-list">
        {recipes.length === 0 ? (
          <div className="empty-message recipe-empty-state">
            No {type} recipes yet. Start by saving a reusable {type} search.
          </div>
        ) : null}
        {recipes.map((recipe) => {
          const isActive = recipe.id === activeRecipeId;

          return (
            <Link
              key={recipe.id}
              className={`recipe-list-item${isActive ? " active" : ""}`}
              href={getRecipeHref(recipe.id)}
            >
              <strong>{recipe.name}</strong>
              <span className="meta">{getRecipeMeta(type, recipe)}</span>
              <span className="meta">
                Updated {new Date(recipe.updatedAt).toLocaleDateString()}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function getRecipeMeta(type: RecipeType, recipe: CompanyRecipe | PeopleRecipe) {
  if (type === "company" && recipe.type === "company") {
    return `${recipe.companyFilters.qOrganizationKeywordTags.length} company keywords • ${recipe.companyFilters.organizationLocations.length} locations`;
  }

  if (type === "people" && recipe.type === "people") {
    return `${recipe.peopleFilters.personTitles.length} people titles • ${recipe.peopleFilters.personDepartments.length} departments`;
  }

  return "";
}
