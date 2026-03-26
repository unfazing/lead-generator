import { randomUUID } from "node:crypto";
import { z } from "zod";
import { getDataFilePath } from "@/lib/db/client";
import { getEnrichedPeopleByApolloIds } from "@/lib/db/repositories/enriched-people";
import {
  readJsonFile,
  writeJsonFileAtomically,
} from "@/lib/db/repositories/file-storage";

export const contactBatchMemberProvenanceSchema = z.object({
  peopleSnapshotId: z.string().min(1),
  sourcePeopleRecipeId: z.string().nullable(),
  addedAt: z.string().min(1),
});

export const contactBatchMemberSchema = z.object({
  id: z.string().min(1),
  batchId: z.string().min(1),
  personApolloId: z.string().min(1),
  fullName: z.string(),
  title: z.string(),
  companyName: z.string(),
  companyApolloId: z.string().nullable(),
  provenance: contactBatchMemberProvenanceSchema.array(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export type ContactBatchMemberProvenance = z.infer<
  typeof contactBatchMemberProvenanceSchema
>;
export type ContactBatchMemberRecord = z.infer<typeof contactBatchMemberSchema>;
export type ContactBatchMemberCoverageRecord = ContactBatchMemberRecord & {
  alreadyEnriched: boolean;
};

const contactBatchMembersFilePath = getDataFilePath("contact-batch-members.json");
const contactBatchMembersSchema = contactBatchMemberSchema.array();

async function readContactBatchMembers() {
  return readJsonFile(contactBatchMembersFilePath, contactBatchMembersSchema, []);
}

async function writeContactBatchMembers(records: ContactBatchMemberRecord[]) {
  await writeJsonFileAtomically(contactBatchMembersFilePath, records);
}

function mergeDisplayValue(current: string, incoming: string | null | undefined) {
  return incoming && incoming.trim().length > 0 ? incoming : current;
}

function mergeNullableDisplayValue(
  current: string | null,
  incoming: string | null | undefined,
) {
  return incoming && incoming.trim().length > 0 ? incoming : current;
}

function mergeProvenance(
  current: ContactBatchMemberProvenance[],
  incoming: ContactBatchMemberProvenance[],
) {
  const merged = new Map<string, ContactBatchMemberProvenance>();

  for (const entry of [...current, ...incoming]) {
    const key = `${entry.peopleSnapshotId}:${entry.sourcePeopleRecipeId ?? ""}`;
    const existing = merged.get(key);

    if (!existing || entry.addedAt.localeCompare(existing.addedAt) < 0) {
      merged.set(key, entry);
    }
  }

  return Array.from(merged.values()).sort((left, right) =>
    left.addedAt.localeCompare(right.addedAt),
  );
}

export async function listContactBatchMembers(batchId: string) {
  const records = await readContactBatchMembers();
  return records
    .filter((record) => record.batchId === batchId)
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export async function listContactBatchMembersWithCoverage(batchId: string) {
  const members = await listContactBatchMembers(batchId);
  const enriched = await getEnrichedPeopleByApolloIds(
    members.map((member) => member.personApolloId),
  );

  return members.map((member) => ({
    ...member,
    alreadyEnriched: enriched.has(member.personApolloId),
  }));
}

export async function getContactBatchMember(
  batchId: string,
  personApolloId: string,
) {
  const records = await readContactBatchMembers();
  return (
    records.find(
      (record) =>
        record.batchId === batchId && record.personApolloId === personApolloId,
    ) ?? null
  );
}

export async function upsertContactBatchMembers(
  batchId: string,
  members: Array<{
    personApolloId: string;
    fullName?: string;
    title?: string;
    companyName?: string;
    companyApolloId?: string | null;
    provenance: ContactBatchMemberProvenance[];
  }>,
) {
  if (members.length === 0) {
    return [];
  }

  const records = await readContactBatchMembers();
  const now = new Date().toISOString();
  const next = [...records];
  const touchedApolloIds = new Set<string>();

  for (const member of members) {
    const existingIndex = next.findIndex(
      (record) =>
        record.batchId === batchId &&
        record.personApolloId === member.personApolloId,
    );

    if (existingIndex >= 0) {
      const existing = next[existingIndex];
      next[existingIndex] = contactBatchMemberSchema.parse({
        ...existing,
        fullName: mergeDisplayValue(existing.fullName, member.fullName),
        title: mergeDisplayValue(existing.title, member.title),
        companyName: mergeDisplayValue(existing.companyName, member.companyName),
        companyApolloId: mergeNullableDisplayValue(
          existing.companyApolloId,
          member.companyApolloId,
        ),
        provenance: mergeProvenance(existing.provenance, member.provenance),
        updatedAt: now,
      });
    } else {
      next.push(
        contactBatchMemberSchema.parse({
          id: randomUUID(),
          batchId,
          personApolloId: member.personApolloId,
          fullName: member.fullName ?? "",
          title: member.title ?? "",
          companyName: member.companyName ?? "",
          companyApolloId: member.companyApolloId ?? null,
          provenance: mergeProvenance([], member.provenance),
          createdAt: now,
          updatedAt: now,
        }),
      );
    }

    touchedApolloIds.add(member.personApolloId);
  }

  await writeContactBatchMembers(next);

  return next.filter(
    (record) =>
      record.batchId === batchId && touchedApolloIds.has(record.personApolloId),
  );
}

export async function removeContactBatchMember(
  batchId: string,
  personApolloId: string,
) {
  const records = await readContactBatchMembers();
  const next = records.filter(
    (record) =>
      !(
        record.batchId === batchId && record.personApolloId === personApolloId
      ),
  );

  if (next.length === records.length) {
    return false;
  }

  await writeContactBatchMembers(next);
  return true;
}

export async function deleteContactBatchMembers(batchId: string) {
  const records = await readContactBatchMembers();
  const next = records.filter((record) => record.batchId !== batchId);

  if (next.length === records.length) {
    return 0;
  }

  await writeContactBatchMembers(next);
  return records.length - next.length;
}
