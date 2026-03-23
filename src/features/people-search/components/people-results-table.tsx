"use client";

import type { PeopleSnapshotRecord } from "@/lib/db/repositories/people-snapshots";
import { DataSnapshotViewer } from "@/features/snapshots/components/data-snapshot-viewer";

const defaultColumns = [
  "full_name",
  "title",
  "company_name",
  "location",
  "seniority",
  "linkedin_url",
  "email_status",
] as const;

type PeopleResultsTableProps = {
  snapshot: PeopleSnapshotRecord | null;
};

export function PeopleResultsTable({ snapshot }: PeopleResultsTableProps) {
  const paramsForViewer = {
    ...snapshot?.recipeParams,
    organizationIds: snapshot?.recipeParams.organizationIds,
    selectionMode: snapshot?.selectionMode,
  };

  return (
    <DataSnapshotViewer
      defaultColumns={defaultColumns}
      emptyMessage="No people snapshot yet. Run people search from the current company and people recipe pairing."
      metaDetail={snapshot ? `${snapshot.result.rows.length} people • source ${snapshot.result.source}` : ""}
      params={paramsForViewer}
      snapshot={snapshot}
    />
  );
}
