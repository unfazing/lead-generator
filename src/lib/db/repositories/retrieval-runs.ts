import { randomUUID } from "node:crypto";
import { z } from "zod";
import { getDataFilePath } from "@/lib/db/client";
import {
  readJsonFile,
  writeJsonFileAtomically,
} from "@/lib/db/repositories/file-storage";
import type { RunPlanRecord } from "@/lib/db/repositories/run-plans";

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
  runPlanId: z.string().min(1),
  peopleSnapshotId: z.string().min(1),
  companyRecipeId: z.string().min(1),
  peopleRecipeId: z.string().min(1),
  companySnapshotId: z.string().min(1),
  status: retrievalRunStatusSchema,
  totalItems: z.number().int().nonnegative(),
  processedItems: z.number().int().nonnegative(),
  successfulItems: z.number().int().nonnegative(),
  failedItems: z.number().int().nonnegative(),
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
  plan: RunPlanRecord,
  totalItems: number,
) {
  const records = await readRetrievalRuns();
  const now = new Date().toISOString();
  const run: RetrievalRunRecord = {
    id: randomUUID(),
    runPlanId: plan.id,
    peopleSnapshotId: plan.peopleSnapshotId,
    companyRecipeId: plan.companyRecipeId,
    peopleRecipeId: plan.peopleRecipeId,
    companySnapshotId: plan.companySnapshotId,
    status: "pending",
    totalItems,
    processedItems: 0,
    successfulItems: 0,
    failedItems: 0,
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
