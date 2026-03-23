import Link from "next/link";
import { WorkspaceEmptyState } from "@/features/search-workspace/components/workspace-empty-state";
import { WorkspaceStageNav } from "@/features/search-workspace/components/workspace-stage-nav";
import {
  buildSearchWorkspaceQuery,
  parseSearchWorkspaceContext,
} from "@/features/search-workspace/lib/workspace-route-state";
import { UsageSummary } from "@/features/usage/components/usage-summary";
import { getApolloUsageSummary } from "@/features/usage/lib/apollo-usage";
import { listRecipesByType } from "@/lib/db/repositories/recipes";

type SearchPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = searchParams ? await searchParams : {};
  const context = parseSearchWorkspaceContext("landing", params);

  const [companyRecipes, peopleRecipes, usageSummary] = await Promise.all([
    listRecipesByType("company"),
    listRecipesByType("people"),
    getApolloUsageSummary(),
  ]);
  const companyHref = `/search/company${
    buildSearchWorkspaceQuery({
      workflow: "company",
      companyRecipeId: context.companyRecipeId,
      peopleRecipeId: context.peopleRecipeId,
    })
      ? `?${buildSearchWorkspaceQuery({
          workflow: "company",
          companyRecipeId: context.companyRecipeId,
          peopleRecipeId: context.peopleRecipeId,
        })}`
      : ""
  }`;
  const peopleHref = `/search/people${
    buildSearchWorkspaceQuery({
      workflow: "people",
      companyRecipeId: context.companyRecipeId,
      peopleRecipeId: context.peopleRecipeId,
    })
      ? `?${buildSearchWorkspaceQuery({
          workflow: "people",
          companyRecipeId: context.companyRecipeId,
          peopleRecipeId: context.peopleRecipeId,
        })}`
      : ""
  }`;

  return (
    <main className="shell workspace-shell">
      <section className="workspace-panel search-hero">
        <div className="workspace-header">
          <p className="eyebrow">Search workspace</p>
          <h1>Start from the workflow you want to run.</h1>
          <p>Company search and people search now have separate entry routes, each driven only by explicit recipe and snapshot context.</p>
          <WorkspaceStageNav current="landing" />
        </div>
      </section>
      <div className="stack search-main">
        <UsageSummary summary={usageSummary} />
        <div className="workspace-grid">
          <section className="card stack">
            <div className="workspace-header">
              <p className="eyebrow">Company workflow</p>
              <h2>Run or reopen company snapshots.</h2>
              <p>Use saved company filters, create a fresh snapshot when needed, or reopen the stored one for the same recipe.</p>
            </div>
            <div className="stats-grid">
              <div className="stat-tile">
                <span className="meta">Saved company recipes</span>
                <strong>{companyRecipes.length}</strong>
              </div>
              <div className="stat-tile">
                <span className="meta">Paired people recipe</span>
                <strong>{context.peopleRecipeId ? "Preserved" : "Optional"}</strong>
              </div>
            </div>
            <div className="workspace-actions">
              <Link className="primary-button" href={companyHref}>
                Open company workflow
              </Link>
              <Link className="secondary-button" href="/recipes/company">
                Manage company recipes
              </Link>
            </div>
          </section>
          <section className="card stack">
            <div className="workspace-header">
              <p className="eyebrow">People workflow</p>
              <h2>Load a people recipe and choose company snapshot sources.</h2>
              <p>People search starts from a saved people recipe plus an explicit company snapshot. Nothing auto-runs here.</p>
            </div>
            <div className="stats-grid">
              <div className="stat-tile">
                <span className="meta">Saved people recipes</span>
                <strong>{peopleRecipes.length}</strong>
              </div>
              <div className="stat-tile">
                <span className="meta">Context in URL</span>
                <strong>{context.companyRecipeId || context.peopleRecipeId ? "Explicit" : "None yet"}</strong>
              </div>
            </div>
            <div className="workspace-actions">
              <Link className="primary-button" href={peopleHref}>
                Open people workflow
              </Link>
              <Link className="secondary-button" href="/recipes/people">
                Manage people recipes
              </Link>
            </div>
          </section>
        </div>
        {companyRecipes.length === 0 && peopleRecipes.length === 0 ? (
          <WorkspaceEmptyState
            eyebrow="Search workspace"
            title="Create your first saved recipe."
            description="This workspace is instructions-first. Once you have a company or people recipe, use the route that matches the workflow you want to run."
            primaryAction={{ href: "/recipes/company", label: "Create company recipe" }}
            secondaryAction={{ href: "/recipes/people", label: "Create people recipe" }}
          />
        ) : null}
      </div>
    </main>
  );
}
