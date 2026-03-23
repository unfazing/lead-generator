import { CompanyResultsWorkspace } from "@/features/company-search/components/company-results-workspace";
import { CompanySearchPanel } from "@/features/company-search/components/company-search-panel";
import { CompanySearchWarning } from "@/features/company-search/components/company-search-warning";
import { RecipeEditor } from "@/features/recipes/components/recipe-editor";
import { RecipeList } from "@/features/recipes/components/recipe-list";
import {
  getCompanyRecipeDraft,
  getPeopleRecipeDraft,
} from "@/features/recipes/lib/recipe-form";
import { UsageSummary } from "@/features/usage/components/usage-summary";
import { getApolloUsageSummary } from "@/features/usage/lib/apollo-usage";
import { listSnapshotsForRecipe } from "@/lib/db/repositories/company-snapshots";
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
  const snapshotId = getSingleParam(params, "snapshot");
  const editorTab = getSingleParam(params, "editorTab") === "people" ? "people" : "company";

  const [companyRecipes, peopleRecipes] = await Promise.all([
    listRecipesByType("company"),
    listRecipesByType("people"),
  ]);

  const selectedCompanyRecipe =
    companyRecipeId && companyRecipeId !== "new"
      ? await getRecipeById(companyRecipeId)
      : companyRecipes[0] ?? null;
  const selectedPeopleRecipe =
    peopleRecipeId && peopleRecipeId !== "new"
      ? await getRecipeById(peopleRecipeId)
      : peopleRecipes[0] ?? null;

  const companyRecipe =
    selectedCompanyRecipe?.type === "company" ? selectedCompanyRecipe : null;
  const peopleRecipe =
    selectedPeopleRecipe?.type === "people" ? selectedPeopleRecipe : null;

  const companyDraft = getCompanyRecipeDraft(
    companyRecipeId === "new" ? null : companyRecipe,
  );
  const peopleDraft = getPeopleRecipeDraft(
    peopleRecipeId === "new" ? null : peopleRecipe,
  );
  const usageSummary = await getApolloUsageSummary();
  const snapshots = companyRecipe
    ? await listSnapshotsForRecipe(companyRecipe.id)
    : [];
  const activeSnapshot =
    (snapshotId
      ? snapshots.find((snapshot) => snapshot.id === snapshotId)
      : snapshots[0]) ?? null;
  const companyEditorHref = `/recipes?${new URLSearchParams(
    Object.fromEntries(
      [
        companyRecipeId ? ["companyRecipe", companyRecipeId] : null,
        peopleRecipeId ? ["peopleRecipe", peopleRecipeId] : null,
        snapshotId ? ["snapshot", snapshotId] : null,
        ["editorTab", "company"],
      ].filter(Boolean) as string[][],
    ),
  ).toString()}`;
  const peopleEditorHref = `/recipes?${new URLSearchParams(
    Object.fromEntries(
      [
        companyRecipeId ? ["companyRecipe", companyRecipeId] : null,
        peopleRecipeId ? ["peopleRecipe", peopleRecipeId] : null,
        snapshotId ? ["snapshot", snapshotId] : null,
        ["editorTab", "people"],
      ].filter(Boolean) as string[][],
    ),
  ).toString()}`;

  return (
    <main className="shell workspace-shell">
      <section className="workspace-panel">
        <div className="workspace-header">
          <p className="eyebrow">Search workspace</p>
          <h1>Mix a company search with any people search.</h1>
          <p>
            Save company and people recipes independently, then pair them in one
            workspace before you search or spend.
          </p>
        </div>
      </section>
      <div className="workspace-grid workspace-grid-wide">
        <div className="stack">
          <RecipeList
            activeRecipeId={companyRecipeId === "new" ? null : companyRecipe?.id ?? null}
            pairedRecipeId={peopleRecipeId === "new" ? null : peopleRecipe?.id ?? null}
            recipes={companyRecipes}
            type="company"
          />
          <RecipeList
            activeRecipeId={peopleRecipeId === "new" ? null : peopleRecipe?.id ?? null}
            pairedRecipeId={companyRecipeId === "new" ? null : companyRecipe?.id ?? null}
            recipes={peopleRecipes}
            type="people"
          />
        </div>
        <div className="stack">
          <UsageSummary summary={usageSummary} />
          <CompanySearchPanel
            pairedPeopleRecipe={peopleRecipe}
            recipe={companyRecipe}
            snapshot={activeSnapshot}
          />
          <CompanySearchWarning warnings={activeSnapshot?.result.warnings ?? []} />
          <CompanyResultsWorkspace snapshot={activeSnapshot} />
          <section className="card stack">
            <div className="workspace-header">
              <p className="eyebrow">Recipe creation</p>
              <h2>Save company and people searches separately.</h2>
              <p>
                Use tabs to switch between recipe types without losing the paired search context.
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
                pairedRecipeId={peopleRecipeId === "new" ? null : peopleRecipe?.id ?? null}
                recipe={companyRecipeId === "new" ? null : companyRecipe}
                type="company"
              />
            ) : (
              <RecipeEditor
                draft={peopleDraft}
                pairedRecipeId={companyRecipeId === "new" ? null : companyRecipe?.id ?? null}
                recipe={peopleRecipeId === "new" ? null : peopleRecipe}
                type="people"
              />
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
