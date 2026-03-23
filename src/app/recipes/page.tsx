import Link from "next/link";
import { RecipeEditor } from "@/features/recipes/components/recipe-editor";
import { RecipeList } from "@/features/recipes/components/recipe-list";
import {
  getCompanyRecipeDraft,
  getPeopleRecipeDraft,
} from "@/features/recipes/lib/recipe-form";
import {
  getRecipeById,
  listRecipesByType,
} from "@/lib/db/repositories/recipes";

type RecipesPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getSingleParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = params[key];
  return typeof value === "string" ? value : Array.isArray(value) ? value[0] : null;
}

export default async function RecipesPage({ searchParams }: RecipesPageProps) {
  const params = searchParams ? await searchParams : {};
  const companyRecipeId = getSingleParam(params, "companyRecipe");
  const peopleRecipeId = getSingleParam(params, "peopleRecipe");
  const editorTab = getSingleParam(params, "editorTab") === "people" ? "people" : "company";
  const editorMode = getSingleParam(params, "editorMode") === "new" ? "new" : "edit";

  const [companyRecipes, peopleRecipes] = await Promise.all([
    listRecipesByType("company"),
    listRecipesByType("people"),
  ]);

  const selectedCompanyRecipe = companyRecipeId
    ? await getRecipeById(companyRecipeId)
    : companyRecipes[0] ?? null;
  const selectedPeopleRecipe = peopleRecipeId
    ? await getRecipeById(peopleRecipeId)
    : peopleRecipes[0] ?? null;

  const companyRecipe =
    selectedCompanyRecipe?.type === "company" ? selectedCompanyRecipe : null;
  const peopleRecipe =
    selectedPeopleRecipe?.type === "people" ? selectedPeopleRecipe : null;

  const companyDraft = getCompanyRecipeDraft(
    editorTab === "company" && editorMode === "new" ? null : companyRecipe,
  );
  const peopleDraft = getPeopleRecipeDraft(
    editorTab === "people" && editorMode === "new" ? null : peopleRecipe,
  );
  const companyEditorHref = `/recipes?${new URLSearchParams(
    Object.fromEntries(
      [
        companyRecipeId ? ["companyRecipe", companyRecipeId] : null,
        peopleRecipeId ? ["peopleRecipe", peopleRecipeId] : null,
        ["editorTab", "company"],
        ["editorMode", editorTab === "company" ? editorMode : "edit"],
      ].filter(Boolean) as string[][],
    ),
  ).toString()}`;
  const peopleEditorHref = `/recipes?${new URLSearchParams(
    Object.fromEntries(
      [
        companyRecipeId ? ["companyRecipe", companyRecipeId] : null,
        peopleRecipeId ? ["peopleRecipe", peopleRecipeId] : null,
        ["editorTab", "people"],
        ["editorMode", editorTab === "people" ? editorMode : "edit"],
      ].filter(Boolean) as string[][],
    ),
  ).toString()}`;

  return (
    <main className="shell workspace-shell">
      <section className="workspace-panel">
        <div className="workspace-header">
          <p className="eyebrow">Recipe management</p>
          <h1>Create and refine company and people recipes.</h1>
          <p>
            Keep recipe authoring separate from operational search work, then move to the search page when you want to pair recipes and inspect snapshots.
          </p>
          <div className="tab-bar">
            <Link className="tab-pill active" href="/recipes">
              Recipes
            </Link>
            <Link className="tab-pill" href="/search">
              Search
            </Link>
          </div>
        </div>
      </section>
      <div className="workspace-grid workspace-grid-wide">
        <div className="stack">
          <RecipeList
            activeRecipeId={companyRecipe?.id ?? null}
            basePath="/recipes"
            pairedRecipeId={peopleRecipe?.id ?? null}
            recipes={companyRecipes}
            type="company"
          />
          <RecipeList
            activeRecipeId={peopleRecipe?.id ?? null}
            basePath="/recipes"
            pairedRecipeId={companyRecipe?.id ?? null}
            recipes={peopleRecipes}
            type="people"
          />
        </div>
        <div className="stack">
          <section className="card stack">
            <div className="workspace-header">
              <p className="eyebrow">Recipe editor</p>
              <h2>Save company and people searches separately.</h2>
              <p>
                Switch tabs to author either recipe type without mixing editing with snapshot review.
              </p>
            </div>
            <div className="tab-bar">
              <a
                className={`tab-pill${editorTab === "company" ? " active" : ""}`}
                href={companyEditorHref}
              >
                Company recipe
              </a>
              <a
                className={`tab-pill${editorTab === "people" ? " active" : ""}`}
                href={peopleEditorHref}
              >
                People recipe
              </a>
            </div>
            {editorTab === "company" ? (
              <RecipeEditor
                draft={companyDraft}
                pairedRecipeId={peopleRecipe?.id ?? null}
                recipe={editorMode === "new" ? null : companyRecipe}
                type="company"
              />
            ) : (
              <RecipeEditor
                draft={peopleDraft}
                pairedRecipeId={companyRecipe?.id ?? null}
                recipe={editorMode === "new" ? null : peopleRecipe}
                type="people"
              />
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
