import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { ContactBatchList } from "@/features/enrich/components/contact-batch-list";
import { AddToBatchFromSnapshot } from "@/features/enrich/components/add-to-batch-from-snapshot";
import { ContactBatchPanel } from "@/features/enrich/components/contact-batch-panel";
import { EnrichedPeopleStorePanel } from "@/features/enrich/components/enriched-people-store-panel";
import { EnrichedPeopleResults } from "@/features/retrieval-runs/components/enriched-people-results";
import { WorkspaceEmptyState } from "@/features/search-workspace/components/workspace-empty-state";
import { WorkspaceStageNav } from "@/features/search-workspace/components/workspace-stage-nav";
import { InfoTip } from "@/features/ui/components/info-tip";
import {
  createContactBatch,
  deleteContactBatch,
  getContactBatchById,
  listContactBatches,
  updateContactBatch,
  type ContactBatchRecord,
} from "@/lib/db/repositories/contact-batches";
import { listRecipesByType } from "@/lib/db/repositories/recipes";
import {
  deleteContactBatchMembers,
  listContactBatchMembersWithCoverage,
  removeContactBatchMember,
} from "@/lib/db/repositories/contact-batch-members";
import { getEnrichedPeopleByApolloIds } from "@/lib/db/repositories/enriched-people";
import { listPeopleSnapshots } from "@/lib/db/repositories/people-snapshots";
import { getLatestRetrievalRunForContactBatch } from "@/lib/db/repositories/retrieval-runs";
import { listEnrichedPeopleEntriesForBatch } from "@/lib/db/repositories/retrieval-run-items";
import { buildRetrievalRunSummary } from "@/lib/retrieval/run-summary";

type EnrichPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

type BatchSummary = {
  batch: ContactBatchRecord;
  totalMembers: number;
  alreadyEnrichedMembers: number;
  lastAddedFromSnapshot: string | null;
};

const batchFormSchema = z.object({
  name: z.string().trim().min(1, "Batch name is required"),
  notes: z.string().default(""),
});

function getSingleParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = params[key];
  return typeof value === "string" ? value : Array.isArray(value) ? value[0] : null;
}

async function buildBatchSummary(batch: ContactBatchRecord): Promise<BatchSummary> {
  const members = await listContactBatchMembersWithCoverage(batch.id);

  return {
    batch,
    totalMembers: members.length,
    alreadyEnrichedMembers: members.filter((member) => member.alreadyEnriched).length,
    lastAddedFromSnapshot:
      members
        .flatMap((member) => member.provenance.map((entry) => entry.peopleSnapshotId))
        .at(-1) ?? null,
  };
}

async function createBatchAction(formData: FormData) {
  "use server";

  const parsed = batchFormSchema.parse({
    name: formData.get("name"),
    notes: formData.get("notes"),
  });

  const created = await createContactBatch(parsed);
  revalidatePath("/enrich");
  redirect(`/enrich?batch=${created.id}`);
}

async function updateBatchAction(formData: FormData) {
  "use server";

  const batchId = String(formData.get("batchId") ?? "");
  if (!batchId) {
    throw new Error("Contact batch is required");
  }

  const parsed = batchFormSchema.parse({
    name: formData.get("name"),
    notes: formData.get("notes"),
  });

  await updateContactBatch(batchId, (batch) => ({
    ...batch,
    name: parsed.name,
    notes: parsed.notes,
  }));

  revalidatePath("/enrich");
  redirect(`/enrich?batch=${batchId}`);
}

async function deleteBatchAction(formData: FormData) {
  "use server";

  const batchId = String(formData.get("batchId") ?? "");
  if (!batchId) {
    throw new Error("Contact batch is required");
  }

  await deleteContactBatchMembers(batchId);
  await deleteContactBatch(batchId);

  revalidatePath("/enrich");
  redirect("/enrich");
}

async function removeBatchMemberAction(formData: FormData) {
  "use server";

  const batchId = String(formData.get("batchId") ?? "");
  const selectedApolloIds = z
    .array(z.string().min(1))
    .parse(JSON.parse(String(formData.get("selectedApolloIds") ?? "[]")));

  if (!batchId || selectedApolloIds.length === 0) {
    throw new Error("Batch and selected people are required");
  }

  for (const personApolloId of selectedApolloIds) {
    await removeContactBatchMember(batchId, personApolloId);
  }

  revalidatePath("/enrich");
  redirect(`/enrich?batch=${batchId}`);
}

export default async function EnrichPage({ searchParams }: EnrichPageProps) {
  const params = searchParams ? await searchParams : {};
  const selectedBatchId = getSingleParam(params, "batch");
  const currentView = getSingleParam(params, "view");
  const showingStore = currentView === "store";
  const batches = await listContactBatches();
  const peopleSnapshots = await listPeopleSnapshots();
  const peopleRecipes = await listRecipesByType("people");
  const summaries = await Promise.all(batches.map(buildBatchSummary));
  const activeBatchSummary =
    summaries.find((summary) => summary.batch.id === selectedBatchId) ?? null;
  const activeBatch = activeBatchSummary
    ? await getContactBatchById(activeBatchSummary.batch.id)
    : null;
  const activeMembers = activeBatch
    ? await listContactBatchMembersWithCoverage(activeBatch.id)
    : [];
  const activeRetrievalRun = activeBatch
    ? await getLatestRetrievalRunForContactBatch(activeBatch.id)
    : null;
  const activeRetrievalSummary = activeRetrievalRun
    ? await buildRetrievalRunSummary(activeRetrievalRun.id)
    : null;
  const activeEnrichedEntries = activeBatch
    ? await listEnrichedPeopleEntriesForBatch(activeBatch.id)
    : [];
  const enrichedByApolloId = await getEnrichedPeopleByApolloIds(
    activeMembers.map((member) => member.personApolloId),
  );

  return (
    <main className="shell workspace-shell">
      <section className="workspace-panel search-hero">
        <div className="workspace-header">
          <p className="eyebrow">Enrichment workflow</p>
          <h1 className="heading-with-tip">
            <span>Work from contact batches instead of people snapshots.</span>
            <InfoTip
              content="Contact batches are the reusable enrichment workspace. They stay mutable, dedupe by Apollo person ID, and reflect whether the global enriched-people store already covers each member."
              label="Enrichment workflow help"
            />
          </h1>
          <WorkspaceStageNav current="enrich" />
        </div>
      </section>
      <div className="workspace-grid workspace-grid-wide search-grid">
        <div className="stack search-sidebar">
          <ContactBatchList
            activeBatchId={activeBatch?.id ?? null}
            batches={summaries}
            createAction={createBatchAction}
            deleteAction={deleteBatchAction}
            showingStore={showingStore}
            updateAction={updateBatchAction}
          />
        </div>
        <div className="stack search-main">
          {showingStore ? (
            <EnrichedPeopleStorePanel />
          ) : activeBatch ? (
            <>
              <ContactBatchPanel
                batch={activeBatch}
                enrichedByApolloId={enrichedByApolloId}
                members={activeMembers}
                removeMemberAction={removeBatchMemberAction}
                retrievalSummary={activeRetrievalSummary}
                summary={activeBatchSummary!}
              />
              <EnrichedPeopleResults
                emptyMessage="This batch has no stored enrichment outcomes yet."
                entries={activeEnrichedEntries}
                metaLabel="Batch results"
                scopeLabel={`contact batch ${activeBatch.name}`}
                title="Inspect stored outcomes for this contact batch"
              />
              <AddToBatchFromSnapshot
                activeBatchId={activeBatch?.id ?? null}
                recipes={peopleRecipes.map((recipe) => ({
                  id: recipe.id,
                  name: recipe.name,
                }))}
                snapshots={peopleSnapshots}
              />
            </>
          ) : !showingStore && summaries.length === 0 ? (
            <WorkspaceEmptyState
              eyebrow="Enrichment workflow"
              title="No contact batches created yet."
              description="Create a contact batch here, then use saved people snapshots as source material for adding members into that batch."
              primaryAction={{ href: "/search/people", label: "Open people workflow" }}
              secondaryAction={{ href: "/enrich?view=store", label: "View enriched-people store" }}
            />
          ) : !showingStore ? (
            <WorkspaceEmptyState
              eyebrow="Enrichment workflow"
              title="Choose a contact batch."
              description="Select one saved contact batch from the left before you add members or run enrichment."
              primaryAction={{ href: "/search/people", label: "Browse people snapshots" }}
              secondaryAction={{ href: "/enrich?view=store", label: "View enriched-people store" }}
            />
          ) : null}
        </div>
      </div>
    </main>
  );
}
