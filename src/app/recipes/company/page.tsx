import Link from "next/link";
import { RecipeEditor } from "@/features/recipes/components/recipe-editor";
import { RecipeList } from "@/features/recipes/components/recipe-list";
import { getCompanyRecipeDraft } from "@/features/recipes/lib/recipe-form";
import { getRecipeById, listRecipesByType } from "@/lib/db/repositories/recipes";

type CompanyRecipesPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getSingleParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = params[key];
  return typeof value === "string" ? value : Array.isArray(value) ? value[0] : null;
}

export default async function CompanyRecipesPage({
  searchParams,
}: CompanyRecipesPageProps) {
  const params = searchParams ? await searchParams : {};
  const companyRecipeId = getSingleParam(params, "companyRecipe");
  const peopleRecipeId = getSingleParam(params, "peopleRecipe");
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
    editorMode === "new" ? null : companyRecipe,
  );
  const newCompanyRecipeHref = `/recipes/company?${new URLSearchParams(
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
          <p className="eyebrow">Company recipes</p>
          <h1>Create and refine company search recipes.</h1>
          <p>
            Keep company recipe authoring separate from people recipe setup and operational search work.
          </p>
          <div className="workspace-actions">
            <Link className="primary-button" href={newCompanyRecipeHref}>
              New company recipe
            </Link>
          </div>
          <div className="tab-bar">
            <Link className="tab-pill active" href="/recipes/company">
              Company recipes
            </Link>
            <Link className="tab-pill" href="/recipes/people">
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
            activeRecipeId={companyRecipe?.id ?? null}
            basePath="/recipes/company"
            pairedRecipeId={peopleRecipe?.id ?? null}
            recipes={companyRecipes}
            type="company"
          />
        </div>
        <div className="stack">
          <RecipeEditor
            draft={companyDraft}
            pairedRecipeId={peopleRecipe?.id ?? null}
            recipe={editorMode === "new" ? null : companyRecipe}
            type="company"
          />
        </div>
      </div>
    </main>
  );
}
