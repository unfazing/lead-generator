"use client";

import { useEffect, useState } from "react";
import {
  defaultCompanyPreviewColumns,
} from "@/lib/apollo/company-filter-definitions";
import type { CompanySnapshotRecord } from "@/lib/db/repositories/company-snapshots";
import { SnapshotColumnPicker } from "@/features/snapshots/components/snapshot-column-picker";
import { SnapshotParamsViewer } from "@/features/snapshots/components/snapshot-params-viewer";
import { SnapshotResultsTable } from "@/features/snapshots/components/snapshot-results-table";

type CompanySnapshotPreviewProps = {
  snapshot: CompanySnapshotRecord | null;
};

function getInitialOptionalColumns(snapshot: CompanySnapshotRecord | null) {
  if (!snapshot) {
    return [];
  }

  return snapshot.result.availableColumns.filter(
    (column) =>
      !defaultCompanyPreviewColumns.includes(
        column as (typeof defaultCompanyPreviewColumns)[number],
      ),
  );
}

export function CompanySnapshotPreview({ snapshot }: CompanySnapshotPreviewProps) {
  const [selectedOptionalColumns, setSelectedOptionalColumns] = useState<string[]>(
    getInitialOptionalColumns(snapshot),
  );
  const [showColumnControls, setShowColumnControls] = useState(false);
  const [showParams, setShowParams] = useState(false);

  useEffect(() => {
    setSelectedOptionalColumns(getInitialOptionalColumns(snapshot));
    setShowParams(false);
  }, [snapshot]);

  if (!snapshot) {
    return (
      <div className="card empty-message">
        No company snapshot is loaded yet. Run a live search or reopen a stored snapshot.
      </div>
    );
  }

  const availableOptionalColumns = snapshot.result.availableColumns.filter(
    (column) =>
      !defaultCompanyPreviewColumns.includes(
        column as (typeof defaultCompanyPreviewColumns)[number],
      ),
  );

  const selectedColumns = [
    ...defaultCompanyPreviewColumns,
    ...selectedOptionalColumns,
  ];

  function handleToggleColumn(column: string) {
    setSelectedOptionalColumns((current) =>
      current.includes(column)
        ? current.filter((value) => value !== column)
        : [...current, column],
    );
  }

  return (
    <SnapshotResultsTable
      columnPicker={
        <SnapshotColumnPicker
          allColumns={availableOptionalColumns}
          isVisible={showColumnControls}
          onToggleColumn={handleToggleColumn}
          onToggleVisibility={() => setShowColumnControls((current) => !current)}
          selectedColumns={selectedOptionalColumns}
        />
      }
      paramsViewer={
        <SnapshotParamsViewer
          isVisible={showParams}
          onToggleVisibility={() => setShowParams((current) => !current)}
          params={snapshot.recipeParams}
        />
      }
      emptyMessage="No company snapshot is loaded yet. Run a live search or reopen a stored snapshot."
      metaDetail={`${snapshot.result.rows.length} row(s) • page ${snapshot.result.page}`}
      metaLabel=""
      rows={snapshot.result.rows}
      selectedColumns={selectedColumns}
      source={snapshot.result.source}
    />
  );
}
