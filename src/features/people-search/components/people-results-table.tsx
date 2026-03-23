"use client";

import { useEffect, useState } from "react";
import type { PeopleSnapshotRecord } from "@/lib/db/repositories/people-snapshots";
import { SnapshotColumnPicker } from "@/features/snapshots/components/snapshot-column-picker";
import { SnapshotParamsViewer } from "@/features/snapshots/components/snapshot-params-viewer";
import { SnapshotResultsTable } from "@/features/snapshots/components/snapshot-results-table";

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

function getInitialOptionalColumns(snapshot: PeopleSnapshotRecord | null) {
  if (!snapshot) {
    return [];
  }

  return snapshot.result.availableColumns.filter(
    (column) =>
      !defaultColumns.includes(column as (typeof defaultColumns)[number]),
  );
}

export function PeopleResultsTable({ snapshot }: PeopleResultsTableProps) {
  const [selectedOptionalColumns, setSelectedOptionalColumns] = useState<string[]>(
    getInitialOptionalColumns(snapshot),
  );
  const [showColumnControls, setShowColumnControls] = useState(false);
  const [showParams, setShowParams] = useState(false);
  const [selectedPeopleIds, setSelectedPeopleIds] = useState<string[]>([]);

  useEffect(() => {
    setSelectedOptionalColumns(getInitialOptionalColumns(snapshot));
    setShowParams(false);
    setSelectedPeopleIds([]);
  }, [snapshot]);

  if (!snapshot) {
    return (
      <div className="card empty-message">
        No people snapshot yet. Run people search from the current company and people recipe pairing.
      </div>
    );
  }

  const availableOptionalColumns = snapshot.result.availableColumns.filter(
    (column) =>
      !defaultColumns.includes(column as (typeof defaultColumns)[number]),
  );

  const selectedColumns = [
    ...defaultColumns.filter((column) =>
      snapshot.result.availableColumns.includes(column),
    ),
    ...selectedOptionalColumns,
  ];

  function handleToggleColumn(column: string) {
    setSelectedOptionalColumns((current) =>
      current.includes(column)
        ? current.filter((value) => value !== column)
        : [...current, column],
    );
  }

  function handleTogglePerson(personId: string) {
    setSelectedPeopleIds((current) =>
      current.includes(personId)
        ? current.filter((value) => value !== personId)
        : [...current, personId],
    );
  }

  const paramsForViewer = {
    ...snapshot.recipeParams,
    organizationIds: snapshot.recipeParams.organizationIds,
    selectionMode: snapshot.selectionMode,
    organizationImports: snapshot.organizationImports,
  };

  return (
    <SnapshotResultsTable
      columnPicker={
        <SnapshotColumnPicker
          allColumns={availableOptionalColumns}
          isVisible={showColumnControls}
          onToggleColumn={handleToggleColumn}
          onToggleVisibility={() =>
            setShowColumnControls((current) => !current)
          }
          selectedColumns={selectedOptionalColumns}
        />
      }
      paramsViewer={
        <SnapshotParamsViewer
          isVisible={showParams}
          onToggleVisibility={() => setShowParams((current) => !current)}
          params={paramsForViewer}
        />
      }
      emptyMessage="No people snapshot yet. Run people search from the current company and people recipe pairing."
      metaDetail={`${snapshot.result.rows.length} people • source ${snapshot.result.source}`}
      metaLabel={snapshot.selectionMode === "all" ? "All companies" : "Selected companies"}
      onToggleRow={handleTogglePerson}
      rows={snapshot.result.rows}
      selectedColumns={selectedColumns}
      selectedRowIds={selectedPeopleIds}
      source={snapshot.result.source}
    />
  );
}
