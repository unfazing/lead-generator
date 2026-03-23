import Link from "next/link";
import { RecipeEditor } from "@/features/recipes/components/recipe-editor";
import { RecipeList } from "@/features/recipes/components/recipe-list";
import { getPeopleRecipeDraft } from "@/features/recipes/lib/recipe-form";
import { getRecipeById, listRecipesByType } from "@/lib/db/repositories/recipes";

type PeopleRecipesPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getSingleParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = params[key];
  return typeof value === "string" ? value : Array.isArray(value) ? value[0] : null;
}

export default async function PeopleRecipesPage({
  searchParams,
}: PeopleRecipesPageProps) {
  const params = searchParams ? await searchParams : {};
  const companyRecipeId = getSingleParam(params, "companyRecipe");
  const peopleRecipeId = getSingleParam(params, "peopleRecipe");
  const editorMode = getSingleParam(params, "editorMode") === "new" ? "new" : "edit";

  const peopleRecipes = await listRecipesByType("people");

  const selectedCompanyRecipe = companyRecipeId
    ? await getRecipeById(companyRecipeId)
    : null;
  const selectedPeopleRecipe = peopleRecipeId
    ? await getRecipeById(peopleRecipeId)
    : null;

  const companyRecipe =
    selectedCompanyRecipe?.type === "company" ? selectedCompanyRecipe : null;
  const peopleRecipe =
    selectedPeopleRecipe?.type === "people" ? selectedPeopleRecipe : null;
  const peopleDraft = getPeopleRecipeDraft(
    editorMode === "new" ? null : peopleRecipe,
  );
  const newPeopleRecipeHref = `/recipes/people?${new URLSearchParams(
    Object.fromEntries(
      [
        companyRecipeId ? ["companyRecipe", companyRecipeId] : null,
        peopleRecipeId ? ["peopleRecipe", peopleRecipeId] : null,
        ["editorMode", "new"],
      ].filter(Boolean) as string[][],
    ),
  ).toString()}`;

  return (
    <main className="shell workspace-shell">
      <section className="workspace-panel">
        <div className="workspace-header">
          <p className="eyebrow">People recipes</p>
          <h1>Create and refine people search recipes.</h1>
          <p>
            Keep people recipe authoring separate from company recipe setup and operational search work.
          </p>
          <div className="tab-bar">
            <Link className="tab-pill" href="/recipes/company">
              Company recipes
            </Link>
            <Link className="tab-pill active" href="/recipes/people">
              People recipes
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
            activeRecipeId={peopleRecipe?.id ?? null}
            basePath="/recipes/people"
            createHref={newPeopleRecipeHref}
            pairedRecipeId={companyRecipe?.id ?? null}
            recipes={peopleRecipes}
            type="people"
          />
        </div>
        <div className="stack">
          {editorMode === "new" || peopleRecipe ? (
            <RecipeEditor
              key={`${editorMode}-${peopleRecipe?.id ?? "new"}`}
              draft={peopleDraft}
              pairedRecipeId={companyRecipe?.id ?? null}
              recipe={editorMode === "new" ? null : peopleRecipe}
              type="people"
            />
          ) : (
            <section className="card">
              <div className="workspace-header">
                <p className="eyebrow">People recipe</p>
                <h1>Choose a recipe</h1>
                <p>
                  Select a saved people recipe from the left to edit it, or click
                  `New people recipe` to start a fresh one.
                </p>
              </div>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
