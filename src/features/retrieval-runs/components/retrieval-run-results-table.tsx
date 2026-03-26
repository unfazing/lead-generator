"use client";

import React, { useMemo } from "react";
import { DataSnapshotViewer } from "@/features/snapshots/components/data-snapshot-viewer";
import type { EnrichedPeopleEntry } from "@/lib/db/repositories/retrieval-run-items";
import { getQualityLabel, isVerifiedBusinessEmailQuality } from "@/lib/retrieval/quality";

type EnrichedPeopleRow = {
  apollo_id: string;
  full_name: string;
  company_name: string;
  title: string;
  email: string;
  email_status: string;
  outcome_quality: string;
  disposition: string;
  completed_at: string;
  retrieval_status: string;
  reused_from_run_id: string;
  error: string;
} & Record<string, string>;

const defaultColumns = [
  "full_name",
  "title",
  "company_name",
  "email",
  "email_status",
  "outcome_quality",
  "disposition",
  "completed_at",
] as const;

export function RetrievalRunResultsTable({
  entries,
}: {
  entries: EnrichedPeopleEntry[];
}) {
  const rows = useMemo(
    () =>
      [...entries]
        .sort((left, right) => {
          const leftVerified = isVerifiedBusinessEmailQuality(left.outcomeQuality);
          const rightVerified = isVerifiedBusinessEmailQuality(right.outcomeQuality);

          if (leftVerified !== rightVerified) {
            return leftVerified ? -1 : 1;
          }

          return (right.completedAt ?? right.updatedAt).localeCompare(
            left.completedAt ?? left.updatedAt,
          );
        })
        .map(toEnrichedPeopleRow),
    [entries],
  );

  return (
    <DataSnapshotViewer
      defaultColumns={defaultColumns}
      emptyMessage="No enrichment outcomes are available yet."
      metaDetail={`${rows.length} stored outcome${rows.length === 1 ? "" : "s"}`}
      metaLabel="Enrichment results"
      params={{}}
      snapshot={{
        result: {
          rows,
          availableColumns: collectAvailableColumns(rows),
          source: "live",
        },
      }}
    />
  );
}

function toEnrichedPeopleRow(entry: EnrichedPeopleEntry): EnrichedPeopleRow {
  const payloadColumns = flattenPayload(entry.providerPayload);

  return {
    apollo_id: entry.personApolloId,
    full_name: entry.fullName || payloadColumns.name || payloadColumns.first_name || "—",
    company_name: entry.companyName || payloadColumns.organization_name || "—",
    title: entry.title || payloadColumns.title || "—",
    email: entry.email || payloadColumns.email || "—",
    email_status: entry.emailStatus || payloadColumns.email_status || "—",
    outcome_quality: getQualityLabel(entry.outcomeQuality),
    disposition: formatDisposition(entry.disposition),
    completed_at: entry.completedAt ? formatStableDateTime(entry.completedAt) : "—",
    retrieval_status: entry.retrievalStatus,
    reused_from_run_id: entry.reusedFromRunId ?? "—",
    error: entry.error ?? "—",
    ...payloadColumns,
  };
}

function flattenPayload(
  value: Record<string, unknown> | null,
  prefix = "",
): Record<string, string> {
  if (!value) {
    return {};
  }

  const flattened: Record<string, string> = {};

  for (const [key, raw] of Object.entries(value)) {
    const nextKey = prefix ? `${prefix}.${key}` : key;

    if (raw === null || raw === undefined) {
      flattened[nextKey] = "—";
      continue;
    }

    if (Array.isArray(raw)) {
      flattened[nextKey] = JSON.stringify(raw);
      continue;
    }

    if (typeof raw === "object") {
      Object.assign(
        flattened,
        flattenPayload(raw as Record<string, unknown>, nextKey),
      );
      continue;
    }

    flattened[nextKey] = String(raw);
  }

  return flattened;
}

function collectAvailableColumns(rows: EnrichedPeopleRow[]) {
  const columns = new Set<string>(defaultColumns);

  for (const row of rows) {
    for (const column of Object.keys(row)) {
      columns.add(column);
    }
  }

  return Array.from(columns);
}

function formatDisposition(value: EnrichedPeopleEntry["disposition"]) {
  switch (value) {
    case "reused_verified":
      return "Reused verified";
    case "reused_unusable":
      return "Reused unusable";
    case "deduped_within_run":
      return "Deduped in run";
    default:
      return "Apollo call";
  }
}

function formatStableDateTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(new Date(value));
}
