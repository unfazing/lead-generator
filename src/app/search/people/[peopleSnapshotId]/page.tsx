import Link from "next/link";
import { PeopleResultsTable } from "@/features/people-search/components/people-results-table";
import { WorkspaceEmptyState } from "@/features/search-workspace/components/workspace-empty-state";
import { WorkspaceStageNav } from "@/features/search-workspace/components/workspace-stage-nav";
import {
  buildSearchWorkspaceQuery,
  parseSearchWorkspaceContext,
} from "@/features/search-workspace/lib/workspace-route-state";
import { getPeopleSnapshotById } from "@/lib/db/repositories/people-snapshots";
import { getRecipeById } from "@/lib/db/repositories/recipes";

type PeopleSnapshotReviewPageProps = {
  params: Promise<{ peopleSnapshotId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PeopleSnapshotReviewPage({
  params,
  searchParams,
}: PeopleSnapshotReviewPageProps) {
  const { peopleSnapshotId } = await params;
  const query = searchParams ? await searchParams : {};
  const context = parseSearchWorkspaceContext("people", query);
  const snapshot = await getPeopleSnapshotById(peopleSnapshotId);

  if (!snapshot) {
    return (
      <main className="shell workspace-shell">
        <WorkspaceEmptyState
          eyebrow="People workflow"
          title="People snapshot not found."
          description="Run people search from the people workflow to create a reviewed snapshot."
          primaryAction={{ href: "/search/people", label: "Back to people workflow" }}
        />
      </main>
    );
  }

  const selectedPeopleRecipe = context.peopleRecipeId
    ? await getRecipeById(context.peopleRecipeId)
    : await getRecipeById(snapshot.peopleRecipeId);
  const peopleRecipe =
    selectedPeopleRecipe?.type === "people" ? selectedPeopleRecipe : null;

  return (
    <main className="shell workspace-shell">
      <section className="workspace-panel search-hero">
        <div className="workspace-header">
          <p className="eyebrow">People snapshot review</p>
          <h1>Review one saved people snapshot.</h1>
          <p>
            This route shows the executed request params and the imported company provenance that produced the current people result set.
          </p>
          <WorkspaceStageNav current="people" />
        </div>
      </section>
      <div className="stack search-main">
        <div className="card stack">
          <div className="workspace-header">
            <p className="eyebrow">Snapshot context</p>
            <h2>{peopleRecipe?.name ?? "People snapshot"}</h2>
            <p>
              Snapshot {snapshot.id.slice(0, 8)} · {snapshot.organizationImports.length} import source(s)
            </p>
          </div>
          <div className="workspace-actions">
            <Link
              className="secondary-button"
              href={`/search/people?${buildSearchWorkspaceQuery({
                workflow: "people",
                peopleRecipeId: snapshot.peopleRecipeId,
                sourceSnapshotIds: snapshot.organizationImports.map(
                  (entry) => entry.snapshotId,
                ),
              })}`}
            >
              Back to people workflow
            </Link>
          </div>
        </div>
        <PeopleResultsTable snapshot={snapshot} />
      </div>
    </main>
  );
}
