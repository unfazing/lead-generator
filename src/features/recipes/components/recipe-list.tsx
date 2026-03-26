"use client";

import { deleteRecipeAction } from "@/app/recipes/actions";
import { PreservedScrollLink } from "@/features/ui/components/preserved-scroll-link";
import type { CompanyRecipe, PeopleRecipe, RecipeType } from "@/lib/recipes/schema";

type RecipeListProps =
  | {
      basePath: string;
      createHref?: string | null;
      editorBasePath?: string | null;
      editorMode?: "view" | "edit" | "new";
      extraQuery?: Record<string, string | string[] | null | undefined>;
      type: "company";
      recipes: CompanyRecipe[];
      activeRecipeId: string | null;
      pairedRecipeId: string | null;
    }
  | {
      basePath: string;
      createHref?: string | null;
      editorBasePath?: string | null;
      editorMode?: "view" | "edit" | "new";
      extraQuery?: Record<string, string | string[] | null | undefined>;
      type: "people";
      recipes: PeopleRecipe[];
      activeRecipeId: string | null;
      pairedRecipeId: string | null;
    };

export function RecipeList({
  basePath,
  createHref,
  editorBasePath,
  editorMode = "view",
  extraQuery,
  type,
  recipes,
  activeRecipeId,
  pairedRecipeId,
}: RecipeListProps) {
  const title = type === "company" ? "Company recipes" : "People recipes";

  function confirmDelete(recipeName: string) {
    return window.confirm(`Delete "${recipeName}" and its related snapshots?`);
  }

  function buildHref(params: URLSearchParams) {
    if (extraQuery) {
      for (const [key, value] of Object.entries(extraQuery)) {
        if (Array.isArray(value)) {
          value.forEach((item) => {
            if (item) {
              params.append(key, item);
            }
          });
          continue;
        }

        if (value) {
          params.set(key, value);
        }
      }
    }

    const query = params.toString();
    return query ? `${basePath}?${query}` : basePath;
  }

  function getClearedHref() {
    const params = new URLSearchParams();

    if (type === "company") {
      if (pairedRecipeId) {
        params.set("peopleRecipe", pairedRecipeId);
      }
    } else if (pairedRecipeId) {
      params.set("companyRecipe", pairedRecipeId);
    }

    return buildHref(params);
  }

  function getRecipeHref(recipeId: string) {
    const params = new URLSearchParams();

    if (type === "company") {
      params.set("companyRecipe", recipeId);
      if (pairedRecipeId) {
        params.set("peopleRecipe", pairedRecipeId);
      }
    } else {
      params.set("peopleRecipe", recipeId);
      if (pairedRecipeId) {
        params.set("companyRecipe", pairedRecipeId);
      }
    }

    return buildHref(params);
  }

  function getEditorHref(recipeId: string) {
    const resolvedEditorBasePath =
      editorBasePath ?? (type === "company" ? "/search/company" : "/search/people");
    const params = new URLSearchParams();

    if (type === "company") {
      params.set("companyRecipe", recipeId);
      if (pairedRecipeId) {
        params.set("peopleRecipe", pairedRecipeId);
      }
    } else {
      params.set("peopleRecipe", recipeId);
      if (pairedRecipeId) {
        params.set("companyRecipe", pairedRecipeId);
      }
    }

    params.set("editorMode", "edit");

    const query = params.toString();
    return query ? `${resolvedEditorBasePath}?${query}` : resolvedEditorBasePath;
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
        <PreservedScrollLink className="primary-button recipe-rail-action" href={createHref}>
          {type === "company" ? "New company recipe" : "New people recipe"}
        </PreservedScrollLink>
      ) : null}
      <div className="recipe-list">
        {recipes.length === 0 ? (
          <div className="empty-message recipe-empty-state">
            No {type} recipes yet. Start by saving a reusable {type} search.
          </div>
        ) : null}
        {recipes.map((recipe) => {
          const isActive = recipe.id === activeRecipeId;
          const recipeHref = isActive ? getClearedHref() : getRecipeHref(recipe.id);
          const editorHref = getEditorHref(recipe.id);
          const isEditingActiveRecipe =
            editorMode === "edit" && isActive;

          return (
            <div
              key={recipe.id}
              className={`recipe-list-item${isActive ? " active" : ""}`}
            >
              <PreservedScrollLink
                className="recipe-list-link"
                confirmIfRecipeDirty={editorMode === "edit" || editorMode === "new"}
                href={recipeHref}
              >
                <strong>{recipe.name}</strong>
                <span className="meta">{getRecipeMeta(type, recipe)}</span>
                <span className="meta">
                  Updated {formatStableDate(recipe.updatedAt)}
                </span>
              </PreservedScrollLink>
              <div className="recipe-list-actions">
                <PreservedScrollLink
                  aria-label={
                    isEditingActiveRecipe
                      ? `Close editor for ${recipe.name}`
                      : `Edit ${recipe.name}`
                  }
                  className="secondary-button recipe-edit-button"
                  confirmIfRecipeDirty={isEditingActiveRecipe}
                  href={isEditingActiveRecipe ? recipeHref : editorHref}
                >
                  {isEditingActiveRecipe ? "×" : "✎"}
                </PreservedScrollLink>
                {!isEditingActiveRecipe ? (
                  <form
                    action={deleteRecipeAction}
                    onSubmit={(event) => {
                      if (!confirmDelete(recipe.name)) {
                        event.preventDefault();
                      }
                    }}
                  >
                    <input type="hidden" name="recipeId" value={recipe.id} />
                    <input type="hidden" name="recipeType" value={type} />
                    {type === "company" ? (
                      pairedRecipeId ? (
                        <input type="hidden" name="pairedPeopleRecipeId" value={pairedRecipeId} />
                      ) : null
                    ) : pairedRecipeId ? (
                      <input type="hidden" name="pairedCompanyRecipeId" value={pairedRecipeId} />
                    ) : null}
                    <button
                      aria-label={`Delete ${recipe.name}`}
                      className="secondary-button recipe-delete-button"
                      type="submit"
                    >
                      🗑
                    </button>
                  </form>
                ) : null}
              </div>
            </div>
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
    return `${recipe.peopleFilters.personTitles.length} people titles • ${recipe.peopleFilters.personSeniorities.length} seniority filters`;
  }

  return "";
}

function formatStableDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}
