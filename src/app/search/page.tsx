import Link from "next/link";
import { CompanyResultsWorkspace } from "@/features/company-search/components/company-results-workspace";
import { CompanySearchPanel } from "@/features/company-search/components/company-search-panel";
import { CompanySearchWarning } from "@/features/company-search/components/company-search-warning";
import { RecipeList } from "@/features/recipes/components/recipe-list";
import { RunPlanPanel } from "@/features/run-planning/components/run-plan-panel";
import { UsageSummary } from "@/features/usage/components/usage-summary";
import { getApolloUsageSummary } from "@/features/usage/lib/apollo-usage";
import { listSnapshotsForRecipe } from "@/lib/db/repositories/company-snapshots";
import { listPeopleSnapshotsForContext } from "@/lib/db/repositories/people-snapshots";
import { getLatestRunPlanForPeopleSnapshot } from "@/lib/db/repositories/run-plans";
import { getRecipeById, listRecipesByType } from "@/lib/db/repositories/recipes";

type SearchPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getSingleParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = params[key];
  return typeof value === "string" ? value : Array.isArray(value) ? value[0] : null;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = searchParams ? await searchParams : {};
  const companyRecipeId = getSingleParam(params, "companyRecipe");
  const peopleRecipeId = getSingleParam(params, "peopleRecipe");
  const snapshotId = getSingleParam(params, "snapshot");
  const peopleSnapshotId = getSingleParam(params, "peopleSnapshot");

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

  const usageSummary = await getApolloUsageSummary();
  const snapshots = companyRecipe
    ? await listSnapshotsForRecipe(companyRecipe.id)
    : [];
  const activeSnapshot =
    (snapshotId
      ? snapshots.find((snapshot) => snapshot.id === snapshotId)
      : snapshots[0]) ?? null;
  const peopleSnapshots =
    peopleRecipe && activeSnapshot
      ? await listPeopleSnapshotsForContext(peopleRecipe.id, activeSnapshot.id)
      : [];
  const activePeopleSnapshot =
    (peopleSnapshotId
      ? peopleSnapshots.find((snapshot) => snapshot.id === peopleSnapshotId)
      : peopleSnapshots[0]) ?? null;
  const activeRunPlan = activePeopleSnapshot
    ? await getLatestRunPlanForPeopleSnapshot(activePeopleSnapshot.id)
    : null;

  return (
    <main className="shell workspace-shell">
      <section className="workspace-panel search-hero">
        <div className="workspace-header">
          <p className="eyebrow">Search workspace</p>
          <h1>Pair recipes, run company search, and inspect snapshots.</h1>
          <p>
            Choose one company recipe and one people recipe, then review company snapshots and result columns in a separate operational page.
          </p>
          <div className="tab-bar">
            <Link className="tab-pill" href="/recipes/company">
              Company recipes
            </Link>
            <Link className="tab-pill" href="/recipes/people">
              People recipes
            </Link>
            <Link className="tab-pill active" href="/search">
              Search
            </Link>
          </div>
        </div>
      </section>
      <div className="workspace-grid workspace-grid-wide search-grid">
        <div className="stack search-sidebar">
          <RecipeList
            activeRecipeId={companyRecipe?.id ?? null}
            basePath="/search"
            pairedRecipeId={peopleRecipe?.id ?? null}
            recipes={companyRecipes}
            type="company"
          />
          <RecipeList
            activeRecipeId={peopleRecipe?.id ?? null}
            basePath="/search"
            pairedRecipeId={companyRecipe?.id ?? null}
            recipes={peopleRecipes}
            type="people"
          />
        </div>
        <div className="stack search-main">
          <UsageSummary summary={usageSummary} />
          <CompanySearchPanel
            pairedPeopleRecipe={peopleRecipe}
            recipe={companyRecipe}
            snapshot={activeSnapshot}
          />
          <CompanySearchWarning warnings={activeSnapshot?.result.warnings ?? []} />
          <CompanyResultsWorkspace
            companyRecipeId={companyRecipe?.id ?? null}
            companySnapshot={activeSnapshot}
            peopleRecipe={peopleRecipe}
            peopleSnapshot={activePeopleSnapshot}
          />
          <RunPlanPanel
            companyRecipeId={companyRecipe?.id ?? null}
            peopleRecipe={peopleRecipe}
            peopleSnapshot={activePeopleSnapshot}
            runPlan={activeRunPlan}
          />
        </div>
      </div>
    </main>
  );
}
