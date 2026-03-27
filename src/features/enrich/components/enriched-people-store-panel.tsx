import { DataSnapshotViewer } from "@/features/snapshots/components/data-snapshot-viewer";
import { listEnrichedPeople } from "@/lib/db/repositories/enriched-people";

const defaultColumns = [
  "companyName",
  "fullName",
  "title",
  "email",
] as const;

function getStringField(value: unknown, key: string) {
  if (!value || typeof value !== "object") {
    return "";
  }

  const candidate = (value as Record<string, unknown>)[key];
  return typeof candidate === "string" ? candidate : "";
}

function stringifyPayload(value: unknown) {
  return value ? JSON.stringify(value) : "";
}

export async function EnrichedPeopleStorePanel() {
  const records = await listEnrichedPeople();
  const rows = records.map((record) => ({
    apollo_id: record.personApolloId,
    fullName: getStringField(record.apolloPerson, "name"),
    title: getStringField(record.apolloPerson, "title"),
    quality: record.quality,
    email: record.email ?? "",
    emailStatus: record.emailStatus ?? "",
    error: record.error ?? "",
    sourceRunId: record.sourceRunId,
    enrichedAt: record.enrichedAt,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    companyName: getStringField(
      record.apolloPerson ? record.apolloPerson.organization : null,
      "name",
    ),
    companyApolloId: getStringField(
      record.apolloPerson ? record.apolloPerson.organization : null,
      "id",
    ),
    linkedinUrl: getStringField(record.apolloPerson, "linkedin_url"),
    apolloPersonPayload: stringifyPayload(record.apolloPerson),
  }));
  const availableColumns = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));

  return (
    <DataSnapshotViewer
      defaultColumns={defaultColumns}
      emptyMessage="The global enriched-people store is still empty."
      metaDetail={`${records.length} stored Apollo person record${records.length === 1 ? "" : "s"}`}
      metaLabel="Global store"
      params={{
        scope: "append-only enriched-people store",
        dedupeKey: "personApolloId",
        skipRule: "Any stored Apollo person ID is skipped before Apollo enrichment",
        payloadColumn: "apolloPersonPayload",
      }}
      snapshot={{
        result: {
          rows,
          availableColumns,
          source: "live",
        },
      }}
    />
  );
}
