import { randomUUID } from "node:crypto";
import { z } from "zod";
import { getDataFilePath } from "@/lib/db/client";
import type { PeoplePreviewRow } from "@/lib/apollo/people-search";
import { listRetrievalRuns } from "@/lib/db/repositories/retrieval-runs";
import {
  readJsonFile,
  writeJsonFileAtomically,
} from "@/lib/db/repositories/file-storage";
import { retrievalOutcomeQualities } from "@/lib/retrieval/quality";

export const retrievalRunItemExecutionStatusSchema = z.enum([
  "pending",
  "processing",
  "completed",
  "failed",
]);

export const retrievalRunItemDispositionSchema = z.enum([
  "pending_call",
  "reused_verified",
  "reused_unusable",
  "deduped_within_run",
]);

export const retrievalRunItemQualitySchema = z.enum(retrievalOutcomeQualities);

export const retrievalRunItemSchema = z.object({
  id: z.string().min(1),
  runId: z.string().min(1),
  personApolloId: z.string().min(1),
  fullName: z.string(),
  companyName: z.string(),
  title: z.string(),
  disposition: retrievalRunItemDispositionSchema,
  executionStatus: retrievalRunItemExecutionStatusSchema,
  outcomeQuality: retrievalRunItemQualitySchema.nullable(),
  reusedFromRunId: z.string().nullable(),
  providerPayload: z.record(z.string(), z.unknown()).nullable(),
  status: retrievalRunItemExecutionStatusSchema,
  quality: retrievalRunItemQualitySchema.nullable(),
  email: z.string().nullable(),
  emailStatus: z.string().nullable(),
  error: z.string().nullable(),
  attemptCount: z.number().int().nonnegative(),
  lastAttemptedAt: z.string().nullable(),
  completedAt: z.string().nullable(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export type RetrievalRunItemRecord = z.infer<typeof retrievalRunItemSchema>;
export type EnrichedPeopleEntry = RetrievalRunItemRecord & {
  peopleSnapshotId: string;
  retrievalStatus: string;
};

const retrievalRunItemsFilePath = getDataFilePath("retrieval-run-items.json");
const retrievalRunItemsSchema = retrievalRunItemSchema.array();

async function readRetrievalRunItems() {
  return readJsonFile(retrievalRunItemsFilePath, retrievalRunItemsSchema, []);
}

async function writeRetrievalRunItems(records: RetrievalRunItemRecord[]) {
  await writeJsonFileAtomically(retrievalRunItemsFilePath, records);
}

export async function listRetrievalRunItems(runId: string) {
  const records = await readRetrievalRunItems();
  return records.filter((record) => record.runId === runId);
}

export async function listRetrievalRunItemsByStatuses(
  runId: string,
  statuses: RetrievalRunItemRecord["executionStatus"][],
) {
  const statusSet = new Set(statuses);
  const records = await listRetrievalRunItems(runId);
  return records.filter((record) => statusSet.has(record.executionStatus));
}

export async function createRetrievalRunItems(
  runId: string,
  items: Array<
    Pick<
      RetrievalRunItemRecord,
      | "personApolloId"
      | "fullName"
      | "companyName"
      | "title"
      | "disposition"
      | "executionStatus"
      | "outcomeQuality"
      | "reusedFromRunId"
      | "providerPayload"
      | "email"
      | "emailStatus"
      | "error"
      | "attemptCount"
      | "lastAttemptedAt"
      | "completedAt"
    >
  >,
) {
  const records = await readRetrievalRunItems();
  const now = new Date().toISOString();
  const seeded = items.map((item) =>
    retrievalRunItemSchema.parse({
      id: randomUUID(),
      runId,
      ...item,
      status: item.executionStatus,
      quality: item.outcomeQuality,
      createdAt: now,
      updatedAt: now,
    }),
  );

  await writeRetrievalRunItems([...records, ...seeded]);
  return seeded;
}

export async function seedRetrievalRunItems(
  runId: string,
  rows: PeoplePreviewRow[],
  maxContacts: number,
) {
  return createRetrievalRunItems(
    runId,
    rows.slice(0, maxContacts).map((row) => ({
      personApolloId: row.apollo_id,
      fullName: row.full_name,
      companyName: row.company_name,
      title: row.title,
      disposition: "pending_call",
      executionStatus: "pending",
      outcomeQuality: null,
      reusedFromRunId: null,
      providerPayload: null,
      email: null,
      emailStatus: null,
      error: null,
      attemptCount: 0,
      lastAttemptedAt: null,
      completedAt: null,
    })),
  );
}

export async function updateRetrievalRunItems(
  runId: string,
  updater: (items: RetrievalRunItemRecord[]) => RetrievalRunItemRecord[],
) {
  const records = await readRetrievalRunItems();
  const runItems = records.filter((record) => record.runId === runId);
  const unrelated = records.filter((record) => record.runId !== runId);
  const updated = updater(runItems).map((item) =>
    retrievalRunItemSchema.parse({
      ...item,
      status: item.executionStatus,
      quality: item.outcomeQuality,
      updatedAt: new Date().toISOString(),
    }),
  );

  await writeRetrievalRunItems([...unrelated, ...updated]);
  return updated;
}

export async function listEnrichedPeopleEntriesForSnapshot(
  peopleSnapshotId: string,
) {
  const [runs, items] = await Promise.all([
    listRetrievalRuns(),
    readRetrievalRunItems(),
  ]);
  const runsForSnapshot = runs.filter((run) => run.peopleSnapshotId === peopleSnapshotId);
  const runMap = new Map(runsForSnapshot.map((run) => [run.id, run]));
  const latestByPerson = new Map<string, EnrichedPeopleEntry>();

  for (const item of items) {
    const run = runMap.get(item.runId);
    if (!run || item.executionStatus !== "completed") {
      continue;
    }

    const entry: EnrichedPeopleEntry = {
      ...item,
      peopleSnapshotId: run.peopleSnapshotId,
      retrievalStatus: run.status,
    };
    const existing = latestByPerson.get(item.personApolloId);

    if (!existing) {
      latestByPerson.set(item.personApolloId, entry);
      continue;
    }

    const existingTime = existing.completedAt ?? existing.updatedAt;
    const nextTime = entry.completedAt ?? entry.updatedAt;
    if (nextTime.localeCompare(existingTime) >= 0) {
      latestByPerson.set(item.personApolloId, entry);
    }
  }

  return Array.from(latestByPerson.values()).sort((left, right) =>
    (right.completedAt ?? right.updatedAt).localeCompare(
      left.completedAt ?? left.updatedAt,
    ),
  );
}

export async function listEnrichedPeopleEntriesForBatch(contactBatchId: string) {
  const [runs, items] = await Promise.all([
    listRetrievalRuns(),
    readRetrievalRunItems(),
  ]);
  const runsForBatch = runs.filter((run) => run.contactBatchId === contactBatchId);
  const runMap = new Map(runsForBatch.map((run) => [run.id, run]));
  const latestByPerson = new Map<string, EnrichedPeopleEntry>();

  for (const item of items) {
    const run = runMap.get(item.runId);
    if (!run || item.executionStatus !== "completed") {
      continue;
    }

    const entry: EnrichedPeopleEntry = {
      ...item,
      peopleSnapshotId: run.peopleSnapshotId,
      retrievalStatus: run.status,
    };
    const existing = latestByPerson.get(item.personApolloId);

    if (!existing) {
      latestByPerson.set(item.personApolloId, entry);
      continue;
    }

    const existingTime = existing.completedAt ?? existing.updatedAt;
    const nextTime = entry.completedAt ?? entry.updatedAt;
    if (nextTime.localeCompare(existingTime) >= 0) {
      latestByPerson.set(item.personApolloId, entry);
    }
  }

  return Array.from(latestByPerson.values()).sort((left, right) =>
    (right.completedAt ?? right.updatedAt).localeCompare(
      left.completedAt ?? left.updatedAt,
    ),
  );
}
