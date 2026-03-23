"use client";

import type { PeopleSnapshotRecord } from "@/lib/db/repositories/people-snapshots";
import { DataSnapshotViewer } from "@/features/snapshots/components/data-snapshot-viewer";
import type { ReactNode } from "react";

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
  onSelectionChange?: (rowIds: string[]) => void;
  selectable?: boolean;
  snapshot: PeopleSnapshotRecord | null;
  summarySlot?: ReactNode;
};

export function PeopleResultsTable({
  onSelectionChange,
  selectable = false,
  snapshot,
  summarySlot,
}: PeopleResultsTableProps) {
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
      onSelectionChange={onSelectionChange}
      params={paramsForViewer}
      selectable={selectable}
      snapshot={snapshot}
      summarySlot={summarySlot}
    />
  );
}
