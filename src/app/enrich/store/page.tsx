import Link from "next/link";
import { DataSnapshotViewer } from "@/features/snapshots/components/data-snapshot-viewer";
import { listEnrichedPeople } from "@/lib/db/repositories/enriched-people";

const defaultColumns = [
  "apollo_id",
  "quality",
  "email",
  "emailStatus",
  "sourceRunId",
  "enrichedAt",
] as const;

function getStringField(value: unknown, key: string) {
  if (!value || typeof value !== "object") {
    return "";
  }

  const candidate = (value as Record<string, unknown>)[key];
  return typeof candidate === "string" ? candidate : "";
}

export default async function EnrichedPeopleStorePage() {
  const records = await listEnrichedPeople();
  const rows = records.map((record) => ({
    apollo_id: record.personApolloId,
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
    fullName: getStringField(record.apolloPerson, "name"),
  }));
  const availableColumns = Array.from(
    new Set(rows.flatMap((row) => Object.keys(row))),
  );

  return (
    <main className="shell workspace-shell">
      <section className="workspace-panel search-hero">
        <div className="workspace-header">
          <p className="eyebrow">Global enriched-people store</p>
          <h1>Inspect the append-only enrichment cache.</h1>
          <p>Every Apollo person ID stored here is treated as already handled for future enrichment runs, including unusable outcomes. This route is separate from mutable contact batches by design.</p>
          <div className="workspace-actions">
            <Link className="secondary-button" href="/enrich">
              Open enrichment workspace
            </Link>
            <Link className="secondary-button" href="/search/people">
              Open people workflow
            </Link>
          </div>
        </div>
      </section>
      <DataSnapshotViewer
        defaultColumns={defaultColumns}
        emptyMessage="The global enriched-people store is still empty."
        metaDetail={`${records.length} stored Apollo person record${records.length === 1 ? "" : "s"}`}
        metaLabel="Global store"
        params={{
          scope: "append-only enriched-people store",
          dedupeKey: "personApolloId",
          skipRule: "Any stored Apollo person ID is skipped before Apollo enrichment",
        }}
        snapshot={{
          result: {
            rows,
            availableColumns,
            source: "live",
          },
        }}
      />
    </main>
  );
}
