import { randomUUID } from "node:crypto";
import { z } from "zod";
import { getDataFilePath } from "@/lib/db/client";
import {
  readJsonFile,
  writeJsonFileAtomically,
} from "@/lib/db/repositories/file-storage";

export const retrievalRunStatusSchema = z.enum([
  "pending",
  "active",
  "cooldown",
  "retrying",
  "completed",
  "failed",
]);

const retrievalRunLeaseSchema = z.object({
  holderId: z.string().min(1),
  acquiredAt: z.string().min(1),
  heartbeatAt: z.string().min(1),
  expiresAt: z.string().min(1),
});

export const retrievalRunRecordSchema = z.object({
  id: z.string().min(1),
  peopleSnapshotId: z.string().min(1),
  companyRecipeId: z.string().min(1),
  peopleRecipeId: z.string().min(1),
  companySnapshotId: z.string().min(1),
  maxContacts: z.number().int().positive(),
  estimatedContacts: z.number().int().nonnegative(),
  estimateSummary: z.string(),
  estimateNote: z.string(),
  status: retrievalRunStatusSchema,
  totalItems: z.number().int().nonnegative(),
  processedItems: z.number().int().nonnegative(),
  successfulItems: z.number().int().nonnegative(),
  failedItems: z.number().int().nonnegative(),
  reusedItems: z.number().int().nonnegative(),
  newlyEnrichedItems: z.number().int().nonnegative(),
  apolloRequestedItems: z.number().int().nonnegative(),
  pendingItems: z.number().int().nonnegative(),
  processingItems: z.number().int().nonnegative(),
  currentBatchSize: z.number().int().nonnegative(),
  batchCount: z.number().int().nonnegative(),
  apiRequestCount: z.number().int().nonnegative(),
  retryCount: z.number().int().nonnegative(),
  cooldownUntil: z.string().nullable(),
  retryAfter: z.string().nullable(),
  lastError: z.string().nullable(),
  lastCheckpointAt: z.string().nullable(),
  lastHeartbeatAt: z.string().nullable(),
  lastBatchStartedAt: z.string().nullable(),
  lastBatchCompletedAt: z.string().nullable(),
  startedAt: z.string().nullable(),
  completedAt: z.string().nullable(),
  lease: retrievalRunLeaseSchema.nullable(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export type RetrievalRunStatus = z.infer<typeof retrievalRunStatusSchema>;
export type RetrievalRunRecord = z.infer<typeof retrievalRunRecordSchema>;

export const ACTIVE_RETRIEVAL_RUN_STATUSES = ["active", "cooldown", "retrying"] as const;

export function isRetrievalRunStale(
  run: Pick<RetrievalRunRecord, "status" | "lastHeartbeatAt" | "lease">,
  now = Date.now(),
  staleAfterMs = 60_000,
) {
  if (
    run.status !== "active" &&
    run.status !== "cooldown" &&
    run.status !== "retrying"
  ) {
    return false;
  }

  const heartbeatAt = run.lastHeartbeatAt
    ? new Date(run.lastHeartbeatAt).getTime()
    : Number.NaN;
  const leaseExpiry = run.lease?.expiresAt
    ? new Date(run.lease.expiresAt).getTime()
    : Number.NaN;
  const latestSignal = Math.max(
    Number.isFinite(heartbeatAt) ? heartbeatAt : 0,
    Number.isFinite(leaseExpiry) ? leaseExpiry : 0,
  );

  if (latestSignal === 0) {
    return true;
  }

  return now - latestSignal > staleAfterMs;
}

const retrievalRunsFilePath = getDataFilePath("retrieval-runs.json");
const retrievalRunsSchema = retrievalRunRecordSchema.array();

async function readRetrievalRuns() {
  return readJsonFile(retrievalRunsFilePath, retrievalRunsSchema, []);
}

async function writeRetrievalRuns(records: RetrievalRunRecord[]) {
  await writeJsonFileAtomically(retrievalRunsFilePath, records);
}

export async function listRetrievalRuns() {
  const records = await readRetrievalRuns();
  return records.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getRetrievalRunById(runId: string) {
  const records = await readRetrievalRuns();
  return records.find((record) => record.id === runId) ?? null;
}

export async function getLatestRetrievalRunForPeopleSnapshot(
  peopleSnapshotId: string,
) {
  const records = await readRetrievalRuns();
  return (
    records
      .filter((record) => record.peopleSnapshotId === peopleSnapshotId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0] ?? null
  );
}

export async function createRetrievalRunFromPlan(
  input: {
    companyRecipeId: string;
    peopleRecipeId: string;
    companySnapshotId: string;
    peopleSnapshotId: string;
    maxContacts: number;
    estimatedContacts: number;
    estimateSummary: string;
    estimateNote: string;
  },
  totalItems: number,
) {
  const records = await readRetrievalRuns();
  const now = new Date().toISOString();
  const run: RetrievalRunRecord = {
    id: randomUUID(),
    peopleSnapshotId: input.peopleSnapshotId,
    companyRecipeId: input.companyRecipeId,
    peopleRecipeId: input.peopleRecipeId,
    companySnapshotId: input.companySnapshotId,
    maxContacts: input.maxContacts,
    estimatedContacts: input.estimatedContacts,
    estimateSummary: input.estimateSummary,
    estimateNote: input.estimateNote,
    status: "pending",
    totalItems,
    processedItems: 0,
    successfulItems: 0,
    failedItems: 0,
    reusedItems: 0,
    newlyEnrichedItems: 0,
    apolloRequestedItems: 0,
    pendingItems: totalItems,
    processingItems: 0,
    currentBatchSize: 0,
    batchCount: 0,
    apiRequestCount: 0,
    retryCount: 0,
    cooldownUntil: null,
    retryAfter: null,
    lastError: null,
    lastCheckpointAt: null,
    lastHeartbeatAt: null,
    lastBatchStartedAt: null,
    lastBatchCompletedAt: null,
    startedAt: null,
    completedAt: null,
    lease: null,
    createdAt: now,
    updatedAt: now,
  };

  await writeRetrievalRuns([...records, run]);
  return run;
}

export async function updateRetrievalRun(
  runId: string,
  updater: (run: RetrievalRunRecord) => RetrievalRunRecord,
) {
  const records = await readRetrievalRuns();
  const existing = records.find((record) => record.id === runId);

  if (!existing) {
    throw new Error("Retrieval run not found");
  }

  const updated = retrievalRunRecordSchema.parse({
    ...updater(existing),
    updatedAt: new Date().toISOString(),
  });

  await writeRetrievalRuns(
    records.map((record) => (record.id === runId ? updated : record)),
  );
  return updated;
}

export async function acquireRetrievalRunLease(
  runId: string,
  holderId: string,
  ttlMs = 30_000,
) {
  const records = await readRetrievalRuns();
  const existing = records.find((record) => record.id === runId);

  if (!existing) {
    throw new Error("Retrieval run not found");
  }

  const now = Date.now();
  const conflicting = records.find((record) => {
    if (record.id === runId || !record.lease) {
      return false;
    }

    return new Date(record.lease.expiresAt).getTime() > now;
  });

  if (conflicting) {
    throw new Error(
      `Another retrieval run already holds the active lease: ${conflicting.id}`,
    );
  }

  const acquiredAt = new Date(now).toISOString();
  const updated = retrievalRunRecordSchema.parse({
    ...existing,
    lease: {
      holderId,
      acquiredAt,
      heartbeatAt: acquiredAt,
      expiresAt: new Date(now + ttlMs).toISOString(),
    },
    updatedAt: new Date().toISOString(),
  });

  await writeRetrievalRuns(
    records.map((record) => (record.id === runId ? updated : record)),
  );
  return updated;
}

export async function releaseRetrievalRunLease(runId: string) {
  return updateRetrievalRun(runId, (run) => ({ ...run, lease: null }));
}
