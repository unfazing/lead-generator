import Link from "next/link";
import type { CompanyRecipe, PeopleRecipe, RecipeType } from "@/lib/recipes/schema";

type RecipeListProps =
  | {
      basePath: string;
      type: "company";
      recipes: CompanyRecipe[];
      activeRecipeId: string | null;
      pairedRecipeId: string | null;
    }
  | {
      basePath: string;
      type: "people";
      recipes: PeopleRecipe[];
      activeRecipeId: string | null;
      pairedRecipeId: string | null;
    };

export function RecipeList({
  basePath,
  type,
  recipes,
  activeRecipeId,
  pairedRecipeId,
}: RecipeListProps) {
  const title = type === "company" ? "Company recipes" : "People recipes";
  const newHref =
    type === "company"
      ? `${basePath}?editorMode=new${pairedRecipeId ? `&peopleRecipe=${pairedRecipeId}` : ""}${activeRecipeId ? `&companyRecipe=${activeRecipeId}` : ""}`
      : `${basePath}?editorMode=new${pairedRecipeId ? `&companyRecipe=${pairedRecipeId}` : ""}${activeRecipeId ? `&peopleRecipe=${activeRecipeId}` : ""}`;

  function getRecipeHref(recipeId: string) {
    if (type === "company") {
      return `${basePath}?companyRecipe=${recipeId}${pairedRecipeId ? `&peopleRecipe=${pairedRecipeId}` : ""}${basePath.startsWith("/recipes") ? "&editorMode=edit" : ""}`;
    }

    return `${basePath}?peopleRecipe=${recipeId}${pairedRecipeId ? `&companyRecipe=${pairedRecipeId}` : ""}${basePath.startsWith("/recipes") ? "&editorMode=edit" : ""}`;
  }

  return (
    <section className="stack">
      <div className="card">
        <div className="workspace-header">
          <p className="eyebrow">{title}</p>
          <div className="workspace-actions">
            <span className="badge">{recipes.length} saved</span>
            <Link className="secondary-button" href={newHref}>
              New {type} recipe
            </Link>
          </div>
        </div>
      </div>
      <div className="recipe-list">
        {recipes.length === 0 ? (
          <div className="card empty-message">
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
