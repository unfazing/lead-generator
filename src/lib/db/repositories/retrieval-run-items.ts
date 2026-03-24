import { randomUUID } from "node:crypto";
import { z } from "zod";
import { getDataFilePath } from "@/lib/db/client";
import type { PeoplePreviewRow } from "@/lib/apollo/people-search";
import { listRetrievalRuns } from "@/lib/db/repositories/retrieval-runs";
import {
  readJsonFile,
  writeJsonFileAtomically,
} from "@/lib/db/repositories/file-storage";

export const retrievalRunItemStatusSchema = z.enum([
  "pending",
  "processing",
  "completed",
  "failed",
]);

export const retrievalRunItemQualitySchema = z.enum([
  "verified_business_email",
  "unverified_email",
  "unavailable",
]);

export const retrievalRunItemSchema = z.object({
  id: z.string().min(1),
  runId: z.string().min(1),
  personApolloId: z.string().min(1),
  fullName: z.string(),
  companyName: z.string(),
  title: z.string(),
  status: retrievalRunItemStatusSchema,
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
  statuses: RetrievalRunItemRecord["status"][],
) {
  const statusSet = new Set(statuses);
  const records = await listRetrievalRunItems(runId);
  return records.filter((record) => statusSet.has(record.status));
}

export async function seedRetrievalRunItems(
  runId: string,
  rows: PeoplePreviewRow[],
  maxContacts: number,
) {
  const records = await readRetrievalRunItems();
  const now = new Date().toISOString();
  const seeded = rows.slice(0, maxContacts).map((row) =>
    retrievalRunItemSchema.parse({
      id: randomUUID(),
      runId,
      personApolloId: row.apollo_id,
      fullName: row.full_name,
      companyName: row.company_name,
      title: row.title,
      status: "pending",
      quality: null,
      email: null,
      emailStatus: null,
      error: null,
      attemptCount: 0,
      lastAttemptedAt: null,
      completedAt: null,
      createdAt: now,
      updatedAt: now,
    }),
  );

  await writeRetrievalRunItems([...records, ...seeded]);
  return seeded;
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
    if (!run || item.status !== "completed") {
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
