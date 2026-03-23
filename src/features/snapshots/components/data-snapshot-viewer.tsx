"use client";

import { useEffect, useState, type ReactNode } from "react";
import { SnapshotColumnPicker } from "@/features/snapshots/components/snapshot-column-picker";
import { SnapshotParamsViewer } from "@/features/snapshots/components/snapshot-params-viewer";
import { SnapshotResultsTable } from "@/features/snapshots/components/snapshot-results-table";

type DataSnapshotViewerProps<Row extends { apollo_id: string }> = {
  snapshot: {
    result: {
      rows: Row[];
      availableColumns: string[];
      source: "live" | "fixture";
    };
  } | null;
  defaultColumns: readonly string[];
  emptyMessage: string;
  metaDetail: string;
  metaLabel?: string;
  params: Record<string, unknown>;
  summarySlot?: ReactNode;
  selectable?: boolean;
  onSelectionChange?: (rowIds: string[]) => void;
};

function getInitialOptionalColumns<Row extends { apollo_id: string }>(
  snapshot: DataSnapshotViewerProps<Row>["snapshot"],
  defaultColumns: readonly string[],
) {
  if (!snapshot) {
    return [];
  }

  return snapshot.result.availableColumns.filter(
    (column) => !defaultColumns.includes(column),
  );
}

export function DataSnapshotViewer<Row extends { apollo_id: string }>({
  snapshot,
  defaultColumns,
  emptyMessage,
  metaDetail,
  metaLabel = "",
  params,
  summarySlot,
  selectable = false,
  onSelectionChange,
}: DataSnapshotViewerProps<Row>) {
  const [selectedOptionalColumns, setSelectedOptionalColumns] = useState<string[]>(
    getInitialOptionalColumns(snapshot, defaultColumns),
  );
  const [showColumnControls, setShowColumnControls] = useState(false);
  const [showParams, setShowParams] = useState(false);
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);

  useEffect(() => {
    setSelectedOptionalColumns(getInitialOptionalColumns(snapshot, defaultColumns));
    setShowParams(false);
    setSelectedRowIds([]);
  }, [defaultColumns, snapshot]);

  useEffect(() => {
    onSelectionChange?.(selectedRowIds);
  }, [onSelectionChange, selectedRowIds]);

  if (!snapshot) {
    return <div className="card empty-message">{emptyMessage}</div>;
  }

  const availableOptionalColumns = snapshot.result.availableColumns.filter(
    (column) => !defaultColumns.includes(column),
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

  function handleToggleRow(rowId: string) {
    setSelectedRowIds((current) =>
      current.includes(rowId)
        ? current.filter((value) => value !== rowId)
        : [...current, rowId],
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
          params={params}
        />
      }
      emptyMessage={emptyMessage}
      metaDetail={metaDetail}
      metaLabel={metaLabel}
      onToggleRow={selectable ? handleToggleRow : undefined}
      rows={snapshot.result.rows}
      selectedColumns={selectedColumns}
      selectedRowIds={selectedRowIds}
      source={snapshot.result.source}
      summarySlot={summarySlot}
    />
  );
}
