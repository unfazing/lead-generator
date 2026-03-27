import { getPeopleSnapshotById } from "@/lib/db/repositories/people-snapshots";
import {
  getAlreadyEnrichedApolloIds,
  getEnrichedPeopleByApolloIds,
  upsertEnrichedPeople,
} from "@/lib/db/repositories/enriched-people";
import {
  createRetrievalRunItems,
  listRetrievalRunItems,
  updateRetrievalRunItems,
} from "@/lib/db/repositories/retrieval-run-items";
import {
  acquireRetrievalRunLease,
  createRetrievalRunFromPlan,
  getRetrievalRunById,
  isRetrievalRunStale,
  releaseRetrievalRunLease,
  updateRetrievalRun,
} from "@/lib/db/repositories/retrieval-runs";
import { buildRetrievalRunResumeSummary } from "@/lib/retrieval/run-summary";
import { buildRetrievalPreflight } from "@/lib/retrieval/preflight";
import { isVerifiedBusinessEmailQuality } from "@/lib/retrieval/quality";
import {
  enrichPeopleBatch,
  type EnrichmentBatchResult,
  type EnrichmentTarget,
} from "@/lib/apollo/people-enrichment";

const DEFAULT_BATCH_SIZE = 10;
const DEFAULT_THROTTLE_MS = 50;

type RetrievalSeedRow = {
  apollo_id: string;
  full_name: string;
  title: string;
  company_name: string;
};

function normalizeSeedRows(
  rows: RetrievalSeedRow[],
  selectedApolloIds?: string[],
) {
  const selectedApolloIdSet = selectedApolloIds?.length
    ? new Set(selectedApolloIds)
    : null;

  return selectedApolloIdSet
    ? rows.filter((row) => selectedApolloIdSet.has(row.apollo_id))
    : rows;
}

async function kickoffRetrievalRunForRows(input: {
  companyRecipeId: string;
  peopleRecipeId: string;
  companySnapshotId: string;
  peopleSnapshotId: string;
  contactBatchId?: string | null;
  maxContacts: number;
  estimatedContacts: number;
  estimateSummary: string;
  estimateNote: string;
  rows: RetrievalSeedRow[];
  selectedApolloIds?: string[];
  autoExecute?: boolean;
}) {
  const eligibleRows = normalizeSeedRows(input.rows, input.selectedApolloIds);
  const preflight = await buildRetrievalPreflight(eligibleRows, input.maxContacts);
  const totalItems = preflight.items.length;
  const run = await createRetrievalRunFromPlan(input, totalItems);
  await createRetrievalRunItems(run.id, preflight.items);
  await updateRetrievalRun(run.id, (current) => ({
    ...current,
    processedItems:
      preflight.counts.reusedVerifiedCount +
      preflight.counts.reusedUnusableCount +
      preflight.counts.dedupedWithinRunCount,
    successfulItems: preflight.counts.reusedVerifiedCount,
    failedItems: preflight.counts.reusedUnusableCount,
    reusedItems:
      preflight.counts.reusedVerifiedCount + preflight.counts.reusedUnusableCount,
    dedupedItems: preflight.counts.dedupedWithinRunCount,
    reusedVerifiedItems: preflight.counts.reusedVerifiedCount,
    reusedUnusableItems: preflight.counts.reusedUnusableCount,
    pendingItems: preflight.counts.pendingCallCount,
    lastCheckpointAt: new Date().toISOString(),
  }));
  if (input.autoExecute !== false) {
    void executeRetrievalRun(run.id);
  }
  return run;
}

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

  return kickoffRetrievalRunForRows({
    ...input,
    rows: snapshot.result.rows.map((row) => ({
      apollo_id: row.apollo_id,
      full_name: row.full_name,
      title: row.title,
      company_name: row.company_name,
    })),
  });
}

export async function kickoffRetrievalRunForBatch(input: {
  batchId: string;
  companyRecipeId: string;
  peopleRecipeId: string;
  companySnapshotId: string;
  peopleSnapshotId: string;
  maxContacts: number;
  estimatedContacts: number;
  estimateSummary: string;
  estimateNote: string;
  members: Array<{
    personApolloId: string;
    fullName: string;
    title: string;
    companyName: string;
  }>;
  selectedApolloIds?: string[];
  autoExecute?: boolean;
}) {
  return kickoffRetrievalRunForRows({
    ...input,
    contactBatchId: input.batchId,
    rows: input.members.map((member) => ({
      apollo_id: member.personApolloId,
      full_name: member.fullName,
      title: member.title,
      company_name: member.companyName,
    })),
  });
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
    (item) => item.executionStatus === "pending",
  );
  const pendingApolloIds = pendingItems.map((item) => item.personApolloId);
  const existingApolloIds = await getAlreadyEnrichedApolloIds(pendingApolloIds);

  if (existingApolloIds.size === 0) {
    return 0;
  }

  const enrichedByApolloId = await getEnrichedPeopleByApolloIds([...existingApolloIds]);
  const reusedItems = pendingItems.filter((item) =>
    existingApolloIds.has(item.personApolloId),
  );

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
        disposition: isVerifiedBusinessEmailQuality(enriched.quality)
          ? "reused_verified"
          : "reused_unusable",
        executionStatus: "completed",
        outcomeQuality: enriched.quality,
        reusedFromRunId: enriched.sourceRunId,
        providerPayload: enriched.apolloPerson,
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
    return isVerifiedBusinessEmailQuality(enriched.quality);
  }).length;

  await updateRetrievalRun(runId, (current) => ({
    ...current,
    processedItems: current.processedItems + reusedItems.length,
    successfulItems: current.successfulItems + successfulItems,
    failedItems: current.failedItems + (reusedItems.length - successfulItems),
    reusedItems: current.reusedItems + reusedItems.length,
    reusedVerifiedItems: current.reusedVerifiedItems + successfulItems,
    reusedUnusableItems:
      current.reusedUnusableItems + (reusedItems.length - successfulItems),
    pendingItems: Math.max(current.pendingItems - reusedItems.length, 0),
    lastCheckpointAt: completedAt,
    lastHeartbeatAt: completedAt,
  }));

  return reusedItems.length;
}

async function requeueInterruptedItems(runId: string) {
  const run = await getRetrievalRunById(runId);

  if (!run || !isRetrievalRunStale(run)) {
    return 0;
  }

  const items = await listRetrievalRunItems(runId);
  const interruptedIds = new Set(
    items
      .filter(
        (item) =>
          item.executionStatus === "processing" || item.executionStatus === "failed",
      )
      .map((item) => item.id),
  );

  if (interruptedIds.size === 0) {
    return 0;
  }

  await updateRetrievalRunItems(runId, (current) =>
    current.map((item) =>
      interruptedIds.has(item.id)
        ? {
            ...item,
            executionStatus: "pending",
            status: "pending",
            error: item.executionStatus === "failed" ? item.error : null,
          }
        : item,
    ),
  );

  await updateRetrievalRun(runId, (current) => ({
    ...current,
    status: "pending",
    pendingItems: current.pendingItems + interruptedIds.size,
    processingItems: 0,
    currentBatchSize: 0,
    lease: null,
    retryAfter: null,
    cooldownUntil: null,
    lastError: current.lastError,
    lastCheckpointAt: new Date().toISOString(),
  }));

  return interruptedIds.size;
}

export async function getRetrievalRunResumeSummary(runId: string) {
  return buildRetrievalRunResumeSummary(runId);
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

  await requeueInterruptedItems(runId);

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
        (item) => item.executionStatus === "pending",
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
                executionStatus: "processing",
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
        apolloRequestedItems: current.apolloRequestedItems + batch.length,
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
            batchIds.has(item.id)
              ? { ...item, executionStatus: "pending", status: "pending" }
              : item,
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
            executionStatus: "completed",
            outcomeQuality: outcome.quality,
            providerPayload: outcome.apolloPerson,
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
        (outcome) => isVerifiedBusinessEmailQuality(outcome.quality),
      ).length;
      const failed = result.outcomes.length - succeeded;

      await updateRetrievalRun(runId, (current) => ({
        ...current,
        status: "active",
        processedItems: current.processedItems + result.outcomes.length,
        successfulItems: current.successfulItems + succeeded,
        failedItems: current.failedItems + failed,
        newlyEnrichedItems: current.newlyEnrichedItems + result.outcomes.length,
        processingItems: 0,
        currentBatchSize: 0,
        lastBatchCompletedAt: completedAt,
        lastHeartbeatAt: completedAt,
        lastCheckpointAt: completedAt,
      }));

      if (
        (await listRetrievalRunItems(runId)).some(
          (item) => item.executionStatus === "pending",
        )
      ) {
        await wait(throttleMs);
      }
    }
  } finally {
    await releaseRetrievalRunLease(runId);
  }
}
