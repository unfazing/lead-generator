import { randomUUID } from "node:crypto";
import { z } from "zod";
import { getDataFilePath } from "@/lib/db/client";
import {
  readJsonFile,
  writeJsonFileAtomically,
} from "@/lib/db/repositories/file-storage";

export const contactBatchRecordSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1),
  notes: z.string(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export type ContactBatchRecord = z.infer<typeof contactBatchRecordSchema>;

const contactBatchesFilePath = getDataFilePath("contact-batches.json");
const contactBatchesSchema = contactBatchRecordSchema.array();

async function readContactBatches() {
  return readJsonFile(contactBatchesFilePath, contactBatchesSchema, []);
}

async function writeContactBatches(records: ContactBatchRecord[]) {
  await writeJsonFileAtomically(contactBatchesFilePath, records);
}

export async function listContactBatches() {
  const records = await readContactBatches();
  return records.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export async function getContactBatchById(batchId: string) {
  const records = await readContactBatches();
  return records.find((record) => record.id === batchId) ?? null;
}

export async function createContactBatch(input: {
  name: string;
  notes?: string;
}) {
  const records = await readContactBatches();
  const now = new Date().toISOString();
  const record = contactBatchRecordSchema.parse({
    id: randomUUID(),
    name: input.name,
    notes: input.notes ?? "",
    createdAt: now,
    updatedAt: now,
  });

  await writeContactBatches([...records, record]);
  return record;
}

export async function updateContactBatch(
  batchId: string,
  updater: (batch: ContactBatchRecord) => ContactBatchRecord,
) {
  const records = await readContactBatches();
  const existing = records.find((record) => record.id === batchId);

  if (!existing) {
    throw new Error("Contact batch not found");
  }

  const updated = contactBatchRecordSchema.parse({
    ...updater(existing),
    id: existing.id,
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString(),
  });

  await writeContactBatches(
    records.map((record) => (record.id === batchId ? updated : record)),
  );
  return updated;
}

export async function deleteContactBatch(batchId: string) {
  const records = await readContactBatches();
  const next = records.filter((record) => record.id !== batchId);

  if (next.length === records.length) {
    return false;
  }

  await writeContactBatches(next);
  return true;
}
