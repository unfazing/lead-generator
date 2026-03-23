import { randomUUID } from "node:crypto";
import { z } from "zod";
import { getDataFilePath } from "@/lib/db/client";
import type { PeoplePreviewRow } from "@/lib/apollo/people-search";
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
