"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  defaultCompanyPreviewColumns,
} from "@/lib/apollo/company-filter-definitions";
import type { CompanySnapshotRecord } from "@/lib/db/repositories/company-snapshots";
import { SnapshotColumnPicker } from "@/features/snapshots/components/snapshot-column-picker";
import { SnapshotParamsViewer } from "@/features/snapshots/components/snapshot-params-viewer";
import { SnapshotResultsTable } from "@/features/snapshots/components/snapshot-results-table";

type CompanySnapshotPreviewProps = {
  snapshot: CompanySnapshotRecord | null;
  selectable?: boolean;
  summarySlot?: ReactNode;
  onSelectionChange?: (companyIds: string[]) => void;
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

export function CompanySnapshotPreview({
  snapshot,
  selectable = false,
  summarySlot,
  onSelectionChange,
}: CompanySnapshotPreviewProps) {
  const [selectedOptionalColumns, setSelectedOptionalColumns] = useState<string[]>(
    getInitialOptionalColumns(snapshot),
  );
  const [showColumnControls, setShowColumnControls] = useState(false);
  const [showParams, setShowParams] = useState(false);
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<string[]>([]);

  useEffect(() => {
    setSelectedOptionalColumns(getInitialOptionalColumns(snapshot));
    setShowParams(false);
    setSelectedCompanyIds([]);
  }, [snapshot]);

  useEffect(() => {
    onSelectionChange?.(selectedCompanyIds);
  }, [onSelectionChange, selectedCompanyIds]);

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

  function handleToggleCompany(companyId: string) {
    setSelectedCompanyIds((current) =>
      current.includes(companyId)
        ? current.filter((value) => value !== companyId)
        : [...current, companyId],
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
      onToggleRow={selectable ? handleToggleCompany : undefined}
      rows={snapshot.result.rows}
      selectedColumns={selectedColumns}
      selectedRowIds={selectedCompanyIds}
      source={snapshot.result.source}
      summarySlot={summarySlot}
    />
  );
}
