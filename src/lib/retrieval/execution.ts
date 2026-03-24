import { getPeopleSnapshotById } from "@/lib/db/repositories/people-snapshots";
import {
  getEnrichedPeopleByApolloIds,
  upsertEnrichedPeople,
} from "@/lib/db/repositories/enriched-people";
import {
  listRetrievalRunItems,
  seedRetrievalRunItems,
  updateRetrievalRunItems,
} from "@/lib/db/repositories/retrieval-run-items";
import {
  acquireRetrievalRunLease,
  createRetrievalRunFromPlan,
  getRetrievalRunById,
  releaseRetrievalRunLease,
  updateRetrievalRun,
} from "@/lib/db/repositories/retrieval-runs";
import {
  enrichPeopleBatch,
  type EnrichmentBatchResult,
  type EnrichmentTarget,
} from "@/lib/apollo/people-enrichment";

const DEFAULT_BATCH_SIZE = 10;
const DEFAULT_THROTTLE_MS = 50;

export async function kickoffRetrievalRun(input: {
  companyRecipeId: string;
  peopleRecipeId: string;
  companySnapshotId: string;
  peopleSnapshotId: string;
  maxContacts: number;
  estimatedContacts: number;
  estimateSummary: string;
  estimateNote: string;
  selectedApolloIds?: string[];
  autoExecute?: boolean;
}) {
  const snapshot = await getPeopleSnapshotById(input.peopleSnapshotId);

  if (!snapshot) {
    throw new Error("People snapshot not found");
  }

  const selectedApolloIds = input.selectedApolloIds?.length
    ? new Set(input.selectedApolloIds)
    : null;
  const eligibleRows = selectedApolloIds
    ? snapshot.result.rows.filter((row) => selectedApolloIds.has(row.apollo_id))
    : snapshot.result.rows;
  const totalItems = Math.min(eligibleRows.length, input.maxContacts);
  const run = await createRetrievalRunFromPlan(input, totalItems);
  await seedRetrievalRunItems(run.id, eligibleRows, input.maxContacts);
  if (input.autoExecute !== false) {
    void executeRetrievalRun(run.id);
  }
  return run;
}

function toTargets(items: Awaited<ReturnType<typeof listRetrievalRunItems>>): EnrichmentTarget[] {
  return items.map((item) => ({
    personApolloId: item.personApolloId,
    fullName: item.fullName,
    title: item.title,
    companyName: item.companyName,
  }));
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function applyExistingEnrichedPeople(runId: string) {
  const pendingItems = (await listRetrievalRunItems(runId)).filter(
    (item) => item.status === "pending",
  );
  const enrichedByApolloId = await getEnrichedPeopleByApolloIds(
    pendingItems.map((item) => item.personApolloId),
  );
  const reusedItems = pendingItems.filter((item) =>
    enrichedByApolloId.has(item.personApolloId),
  );

  if (reusedItems.length === 0) {
    return 0;
  }

  const reusedIds = new Set(reusedItems.map((item) => item.id));
  const completedAt = new Date().toISOString();

  await updateRetrievalRunItems(runId, (items) =>
    items.map((item) => {
      if (!reusedIds.has(item.id)) {
        return item;
      }

      const enriched = enrichedByApolloId.get(item.personApolloId)!;
      return {
        ...item,
        status: "completed",
        quality: enriched.quality,
        email: enriched.email,
        emailStatus: enriched.emailStatus,
        error: enriched.error,
        completedAt,
      };
    }),
  );

  const successfulItems = reusedItems.filter((item) => {
    const enriched = enrichedByApolloId.get(item.personApolloId)!;
    return enriched.quality === "verified_business_email";
  }).length;

  await updateRetrievalRun(runId, (current) => ({
    ...current,
    processedItems: current.processedItems + reusedItems.length,
    successfulItems: current.successfulItems + successfulItems,
    failedItems: current.failedItems + (reusedItems.length - successfulItems),
    pendingItems: Math.max(current.pendingItems - reusedItems.length, 0),
    lastCheckpointAt: completedAt,
    lastHeartbeatAt: completedAt,
  }));

  return reusedItems.length;
}

export async function executeRetrievalRun(
  runId: string,
  options?: {
    batchSize?: number;
    throttleMs?: number;
    enrichBatch?: (targets: EnrichmentTarget[]) => Promise<EnrichmentBatchResult>;
    wait?: (ms: number) => Promise<void>;
  },
) {
  const batchSize = options?.batchSize ?? DEFAULT_BATCH_SIZE;
  const throttleMs = options?.throttleMs ?? DEFAULT_THROTTLE_MS;
  const enrichBatch = options?.enrichBatch ?? enrichPeopleBatch;
  const wait = options?.wait ?? sleep;

  await acquireRetrievalRunLease(runId, `executor:${runId}`);

  try {
    while (true) {
      const run = await getRetrievalRunById(runId);
      if (!run) {
        throw new Error("Retrieval run not found");
      }

      const reusedCount = await applyExistingEnrichedPeople(runId);
      if (reusedCount > 0) {
        continue;
      }

      const pending = (await listRetrievalRunItems(runId)).filter(
        (item) => item.status === "pending",
      );

      if (pending.length === 0) {
        await updateRetrievalRun(runId, (current) => ({
          ...current,
          status: "completed",
          processingItems: 0,
          currentBatchSize: 0,
          completedAt: new Date().toISOString(),
          lastCheckpointAt: new Date().toISOString(),
        }));
        break;
      }

      const batch = pending.slice(0, batchSize);
      const batchIds = new Set(batch.map((item) => item.id));
      const startedAt = new Date().toISOString();

      await updateRetrievalRunItems(runId, (items) =>
        items.map((item) =>
          batchIds.has(item.id)
            ? {
                ...item,
                status: "processing",
                attemptCount: item.attemptCount + 1,
                lastAttemptedAt: startedAt,
              }
            : item,
        ),
      );
      await updateRetrievalRun(runId, (current) => ({
        ...current,
        status: "active",
        startedAt: current.startedAt ?? startedAt,
        processingItems: batch.length,
        pendingItems: Math.max(current.pendingItems - batch.length, 0),
        currentBatchSize: batch.length,
        batchCount: current.batchCount + 1,
        apiRequestCount: current.apiRequestCount + 1,
        lastBatchStartedAt: startedAt,
        lastHeartbeatAt: startedAt,
        cooldownUntil: null,
        retryAfter: null,
        lastError: null,
      }));

      const result = await enrichBatch(toTargets(batch));

      if (result.type === "rate_limited") {
        const retryAfter = new Date(Date.now() + result.retryAfterMs).toISOString();
        await updateRetrievalRunItems(runId, (items) =>
          items.map((item) =>
            batchIds.has(item.id) ? { ...item, status: "pending" } : item,
          ),
        );
        await updateRetrievalRun(runId, (current) => ({
          ...current,
          status: "cooldown",
          pendingItems: current.pendingItems + batch.length,
          processingItems: 0,
          currentBatchSize: 0,
          retryCount: current.retryCount + 1,
          retryAfter,
          cooldownUntil: retryAfter,
          lastError: result.message,
          lastCheckpointAt: new Date().toISOString(),
        }));
        await wait(result.retryAfterMs);
        continue;
      }

      const outcomeMap = new Map(
        result.outcomes.map((outcome) => [outcome.personApolloId, outcome]),
      );
      const completedAt = new Date().toISOString();

      await updateRetrievalRunItems(runId, (items) =>
        items.map((item) => {
          const outcome = outcomeMap.get(item.personApolloId);
          if (!outcome) {
            return item;
          }

          return {
            ...item,
            status: "completed",
            quality: outcome.quality,
            email: outcome.email,
            emailStatus: outcome.emailStatus,
            error: outcome.error,
            completedAt,
          };
        }),
      );
      await upsertEnrichedPeople(runId, result.outcomes);

      const succeeded = result.outcomes.filter(
        (outcome) => outcome.quality === "verified_business_email",
      ).length;
      const failed = result.outcomes.length - succeeded;

      await updateRetrievalRun(runId, (current) => ({
        ...current,
        status: "active",
        processedItems: current.processedItems + result.outcomes.length,
        successfulItems: current.successfulItems + succeeded,
        failedItems: current.failedItems + failed,
        processingItems: 0,
        currentBatchSize: 0,
        lastBatchCompletedAt: completedAt,
        lastHeartbeatAt: completedAt,
        lastCheckpointAt: completedAt,
      }));

      if ((await listRetrievalRunItems(runId)).some((item) => item.status === "pending")) {
        await wait(throttleMs);
      }
    }
  } finally {
    await releaseRetrievalRunLease(runId);
  }
}
