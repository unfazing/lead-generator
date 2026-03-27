"use client";

import React, { useMemo } from "react";
import { DataSnapshotViewer } from "@/features/snapshots/components/data-snapshot-viewer";
import type { EnrichedPeopleEntry } from "@/lib/db/repositories/retrieval-run-items";

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

export function EnrichedPeopleResults({
  entries,
  emptyMessage = "No enrichment results available yet.",
  metaLabel = "Enriched results",
  scopeLabel = "current scope",
  title = "Stored enrichment outcomes",
}: {
  entries: EnrichedPeopleEntry[];
  emptyMessage?: string;
  metaLabel?: string;
  scopeLabel?: string;
  title?: string;
}) {
  const rows = useMemo(
    () =>
      entries.map((entry) => {
        const companyPayload =
          entry.providerPayload &&
          typeof entry.providerPayload.organization === "object" &&
          entry.providerPayload.organization !== null
            ? entry.providerPayload.organization
            : null;

        return {
          apollo_id: entry.personApolloId,
          fullName: getStringField(entry.providerPayload, "name") || entry.fullName,
          title: getStringField(entry.providerPayload, "title") || entry.title,
          quality: entry.outcomeQuality ?? "",
          email: entry.email ?? "",
          emailStatus: entry.emailStatus ?? "",
          error: entry.error ?? "",
          sourceRunId: entry.runId,
          enrichedAt: entry.completedAt ?? entry.updatedAt,
          createdAt: entry.createdAt,
          updatedAt: entry.updatedAt,
          companyName: getStringField(companyPayload, "name") || entry.companyName,
          companyApolloId: getStringField(companyPayload, "id"),
          linkedinUrl: getStringField(entry.providerPayload, "linkedin_url"),
          apolloPersonPayload: stringifyPayload(entry.providerPayload),
          disposition: entry.disposition,
          reusedFromRunId: entry.reusedFromRunId ?? "",
          retrievalStatus: entry.retrievalStatus,
          lastAttemptedAt: entry.lastAttemptedAt ?? "",
          peopleSnapshotId: entry.peopleSnapshotId,
        };
      }),
    [entries],
  );
  const availableColumns = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));

  return (
    <section className="card stack">
      <div className="workspace-header">
        <p className="eyebrow">Enriched results</p>
        <h3>{title}</h3>
        <p>
          This viewer uses the shared snapshot table stack, so you can filter, sort,
          inspect, and export the stored Apollo payload for {scopeLabel}.
        </p>
      </div>
      <DataSnapshotViewer
        defaultColumns={defaultColumns}
        emptyMessage={emptyMessage}
        metaDetail={`${rows.length} stored result${rows.length === 1 ? "" : "s"}`}
        metaLabel={metaLabel}
        params={{
          scope: scopeLabel,
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
    </section>
  );
}
