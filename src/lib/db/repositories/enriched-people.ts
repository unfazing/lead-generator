import { z } from "zod";
import { getDataFilePath } from "@/lib/db/client";
import type { EnrichmentOutcome } from "@/lib/apollo/people-enrichment";
import {
  readJsonFile,
  writeJsonFileAtomically,
} from "@/lib/db/repositories/file-storage";

export const enrichedPersonRecordSchema = z.object({
  personApolloId: z.string().min(1),
  email: z.string().nullable(),
  emailStatus: z.string().nullable(),
  quality: z.enum([
    "verified_business_email",
    "unverified_email",
    "unavailable",
  ]),
  error: z.string().nullable(),
  apolloPerson: z.record(z.string(), z.unknown()).nullable(),
  sourceRunId: z.string().min(1),
  enrichedAt: z.string().min(1),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export type EnrichedPersonRecord = z.infer<typeof enrichedPersonRecordSchema>;

const enrichedPeopleFilePath = getDataFilePath("enriched-people.json");
const enrichedPeopleSchema = enrichedPersonRecordSchema.array();

async function readEnrichedPeople() {
  return readJsonFile(enrichedPeopleFilePath, enrichedPeopleSchema, []);
}

async function writeEnrichedPeople(records: EnrichedPersonRecord[]) {
  await writeJsonFileAtomically(enrichedPeopleFilePath, records);
}

export async function listEnrichedPeople() {
  return readEnrichedPeople();
}

export async function getEnrichedPeopleByApolloIds(personApolloIds: string[]) {
  if (personApolloIds.length === 0) {
    return new Map<string, EnrichedPersonRecord>();
  }

  const wanted = new Set(personApolloIds);
  const records = await readEnrichedPeople();
  return new Map(
    records
      .filter((record) => wanted.has(record.personApolloId))
      .map((record) => [record.personApolloId, record]),
  );
}

export async function upsertEnrichedPeople(
  runId: string,
  outcomes: EnrichmentOutcome[],
) {
  if (outcomes.length === 0) {
    return [];
  }

  const records = await readEnrichedPeople();
  const now = new Date().toISOString();
  const next = [...records];

  for (const outcome of outcomes) {
    const record: EnrichedPersonRecord = enrichedPersonRecordSchema.parse({
      personApolloId: outcome.personApolloId,
      email: outcome.email,
      emailStatus: outcome.emailStatus,
      quality: outcome.quality,
      error: outcome.error,
      apolloPerson: outcome.apolloPerson,
      sourceRunId: runId,
      enrichedAt: now,
      createdAt:
        records.find((entry) => entry.personApolloId === outcome.personApolloId)?.createdAt ??
        now,
      updatedAt: now,
    });
    const index = next.findIndex(
      (entry) => entry.personApolloId === outcome.personApolloId,
    );

    if (index >= 0) {
      next[index] = record;
    } else {
      next.push(record);
    }
  }

  await writeEnrichedPeople(next);
  return outcomes.map((outcome) => next.find((entry) => entry.personApolloId === outcome.personApolloId)!);
}
