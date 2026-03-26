import { z } from "zod";
import { getDataFilePath } from "@/lib/db/client";
import type { EnrichmentOutcome } from "@/lib/apollo/people-enrichment";
import {
  readJsonFile,
  writeJsonFileAtomically,
} from "@/lib/db/repositories/file-storage";
import { retrievalOutcomeQualities } from "@/lib/retrieval/quality";

export const enrichedPersonRecordSchema = z.object({
  personApolloId: z.string().min(1),
  email: z.string().nullable(),
  emailStatus: z.string().nullable(),
  quality: z.enum(retrievalOutcomeQualities),
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
  const records = await readEnrichedPeople();
  return records.sort((left, right) => right.createdAt.localeCompare(left.createdAt));
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

export async function getAlreadyEnrichedApolloIds(personApolloIds: string[]) {
  return new Set((await getEnrichedPeopleByApolloIds(personApolloIds)).keys());
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
  const existingByApolloId = new Map(
    records.map((record) => [record.personApolloId, record]),
  );

  for (const outcome of outcomes) {
    if (existingByApolloId.has(outcome.personApolloId)) {
      continue;
    }

    const record: EnrichedPersonRecord = enrichedPersonRecordSchema.parse({
      personApolloId: outcome.personApolloId,
      email: outcome.email,
      emailStatus: outcome.emailStatus,
      quality: outcome.quality,
      error: outcome.error,
      apolloPerson: outcome.apolloPerson,
      sourceRunId: runId,
      enrichedAt: now,
      createdAt: now,
      updatedAt: now,
    });
    next.push(record);
    existingByApolloId.set(record.personApolloId, record);
  }

  await writeEnrichedPeople(next);
  return outcomes
    .map((outcome) => existingByApolloId.get(outcome.personApolloId))
    .filter((record): record is EnrichedPersonRecord => Boolean(record));
}
