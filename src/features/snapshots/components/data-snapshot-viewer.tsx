"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
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

function stringifyCellValue(value: unknown) {
  return String(value ?? "").trim();
}

function escapeCsv(value: string) {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, "\"\"")}"`;
  }

  return value;
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
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [filterColumn, setFilterColumn] = useState<string>("");
  const [filterValue, setFilterValue] = useState("");

  useEffect(() => {
    setSelectedOptionalColumns(getInitialOptionalColumns(snapshot, defaultColumns));
    setShowParams(false);
    setSelectedRowIds([]);
    setSortColumn(null);
    setSortDirection("asc");
    setFilterColumn("");
    setFilterValue("");
  }, [defaultColumns, snapshot]);

  useEffect(() => {
    onSelectionChange?.(selectedRowIds);
  }, [onSelectionChange, selectedRowIds]);

  const visibleRows = useMemo(() => {
    if (!snapshot) {
      return [];
    }

    let nextRows = [...snapshot.result.rows];

    if (filterColumn && filterValue.trim()) {
      const normalizedNeedle = filterValue.trim().toLowerCase();
      nextRows = nextRows.filter((row) =>
        stringifyCellValue(row[filterColumn as keyof Row])
          .toLowerCase()
          .includes(normalizedNeedle),
      );
    }

    if (sortColumn) {
      nextRows.sort((left, right) => {
        const leftValue = stringifyCellValue(left[sortColumn as keyof Row]);
        const rightValue = stringifyCellValue(right[sortColumn as keyof Row]);
        const comparison = leftValue.localeCompare(rightValue, undefined, {
          numeric: true,
          sensitivity: "base",
        });

        return sortDirection === "asc" ? comparison : -comparison;
      });
    }

    return nextRows;
  }, [filterColumn, filterValue, sortColumn, sortDirection, snapshot]);

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
  const filterableColumns = snapshot.result.availableColumns;

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

  function handleToggleSort(column: string) {
    if (sortColumn === column) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortColumn(column);
    setSortDirection("asc");
  }

  function handleExportCurrentView() {
    const csvLines = [
      selectedColumns.join(","),
      ...visibleRows.map((row) =>
        selectedColumns
          .map((column) => escapeCsv(stringifyCellValue(row[column as keyof Row])))
          .join(","),
      ),
    ];
    const blob = new Blob([csvLines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "snapshot-export.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <SnapshotResultsTable
      headerActions={
        <button
          className="secondary-button snapshot-export-button"
          onClick={handleExportCurrentView}
          type="button"
        >
          Export current view
        </button>
      }
      controls={
        <div className="snapshot-toolbar">
          <div className="snapshot-toolbar-toggles">
            <SnapshotParamsViewer
              isVisible={showParams}
              onToggleVisibility={() => setShowParams((current) => !current)}
              params={params}
            />
            <SnapshotColumnPicker
              allColumns={availableOptionalColumns}
              isVisible={showColumnControls}
              onToggleColumn={handleToggleColumn}
              onToggleVisibility={() => setShowColumnControls((current) => !current)}
              selectedColumns={selectedOptionalColumns}
            />
          </div>
          <div className="snapshot-toolbar-filters">
            <label className="field">
              <span>Filter column</span>
              <select
                className="snapshot-control-select"
                onChange={(event) => setFilterColumn(event.target.value)}
                value={filterColumn}
              >
                <option value="">None</option>
                {filterableColumns.map((column) => (
                  <option key={column} value={column}>
                    {column}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Filter value</span>
              <input
                className="snapshot-control-input"
                onChange={(event) => setFilterValue(event.target.value)}
                placeholder={filterColumn ? `Contains…` : "Choose a column first"}
                value={filterValue}
              />
            </label>
          </div>
        </div>
      }
      detailPanels={
        showParams || showColumnControls ? (
          <div className="snapshot-detail-panels">
            {showParams ? (
              <SnapshotParamsViewer
                isVisible={showParams}
                onToggleVisibility={() => setShowParams((current) => !current)}
                params={params}
              />
            ) : null}
            {showColumnControls ? (
              <SnapshotColumnPicker
                allColumns={availableOptionalColumns}
                isVisible={showColumnControls}
                onToggleColumn={handleToggleColumn}
                onToggleVisibility={() => setShowColumnControls((current) => !current)}
                selectedColumns={selectedOptionalColumns}
              />
            ) : null}
          </div>
        ) : null
      }
      emptyMessage={emptyMessage}
      metaDetail={metaDetail}
      metaLabel={metaLabel}
      onToggleSort={handleToggleSort}
      onToggleRow={selectable ? handleToggleRow : undefined}
      rows={visibleRows}
      selectedColumns={selectedColumns}
      selectedRowIds={selectedRowIds}
      source={snapshot.result.source}
      sortColumn={sortColumn}
      sortDirection={sortDirection}
      summarySlot={summarySlot}
    />
  );
}
