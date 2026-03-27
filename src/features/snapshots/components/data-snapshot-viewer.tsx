"use client";

import React from "react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { MultiValueInput } from "@/features/recipes/components/multi-value-input";
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

const DEFAULT_ROWS_PER_PAGE = 30;

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
  const [showFilters, setShowFilters] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [filterColumn, setFilterColumn] = useState<string>("");
  const [filterValues, setFilterValues] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setSelectedOptionalColumns(getInitialOptionalColumns(snapshot, defaultColumns));
    setShowParams(false);
    setShowAdvancedOptions(false);
    setSelectedRowIds([]);
    setSortColumn(null);
    setSortDirection("asc");
    setShowFilters(false);
    setFilterColumn("");
    setFilterValues([]);
    setCurrentPage(1);
  }, [defaultColumns, snapshot]);

  useEffect(() => {
    onSelectionChange?.(selectedRowIds);
  }, [onSelectionChange, selectedRowIds]);

  const visibleRows = useMemo(() => {
    if (!snapshot) {
      return [];
    }

    let nextRows = [...snapshot.result.rows];

    if (filterColumn && filterValues.length > 0) {
      const normalizedNeedles = filterValues.map((value) => value.trim().toLowerCase()).filter(Boolean);
      nextRows = nextRows.filter((row) =>
        normalizedNeedles.some((needle) =>
          stringifyCellValue(row[filterColumn as keyof Row])
            .toLowerCase()
            .includes(needle),
        ),
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
  }, [filterColumn, filterValues, sortColumn, sortDirection, snapshot]);

  const totalPages = Math.max(1, Math.ceil(visibleRows.length / DEFAULT_ROWS_PER_PAGE));

  useEffect(() => {
    setCurrentPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

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
  const paginatedRows = visibleRows.slice(
    (currentPage - 1) * DEFAULT_ROWS_PER_PAGE,
    currentPage * DEFAULT_ROWS_PER_PAGE,
  );

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
          <section className="column-picker">
            <div className="column-picker-header snapshot-advanced-header">
              <div className="snapshot-advanced-title-group">
                <p className="eyebrow">Viewer controls</p>
              </div>
              <div className="column-picker-header-actions">
                <button
                  className="secondary-button column-picker-toggle"
                  onClick={() => setShowAdvancedOptions((current) => !current)}
                  type="button"
                >
                  {showAdvancedOptions ? "▴" : "▾"}
                </button>
              </div>
            </div>
          </section>
          {showAdvancedOptions ? (
            <>
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
                <section className="column-picker">
                  <div className="column-picker-header">
                    <strong>Filter rows</strong>
                    <div className="column-picker-header-actions">
                      <span className="column-picker-summary-meta">
                        {filterColumn && filterValues.length > 0
                          ? `${filterValues.length} active`
                          : "None"}
                      </span>
                      <button
                        className="secondary-button column-picker-toggle"
                        onClick={() => setShowFilters((current) => !current)}
                        type="button"
                      >
                        {showFilters ? "▴" : "▾"}
                      </button>
                    </div>
                  </div>
                </section>
              </div>
              {showFilters ? (
                <div className="snapshot-toolbar-filters">
                  <label className="field">
                    <span>Filter column</span>
                    <select
                      className="snapshot-control-select"
                      onChange={(event) => {
                        setFilterColumn(event.target.value);
                        setFilterValues([]);
                      }}
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
                  <MultiValueInput
                    hint="Add one or more filter values. Rows are kept when the selected column matches any of them."
                    label="Filter values"
                    onValuesChange={setFilterValues}
                    persistHiddenInputs={false}
                    placeholder={filterColumn ? "Add filter value" : "Choose a column first"}
                    values={filterValues}
                  />
                </div>
              ) : null}
            </>
          ) : null}
        </div>
      }
      detailPanels={null}
      emptyMessage={emptyMessage}
      metaDetail={metaDetail}
      metaLabel={metaLabel}
      onToggleSort={handleToggleSort}
      onToggleRow={selectable ? handleToggleRow : undefined}
      rows={paginatedRows}
      selectedColumns={selectedColumns}
      selectedRowIds={selectedRowIds}
      source={snapshot.result.source}
      sortColumn={sortColumn}
      sortDirection={sortDirection}
      summarySlot={summarySlot}
      pagination={
        visibleRows.length > DEFAULT_ROWS_PER_PAGE ? (
          <div className="snapshot-pagination">
            <span className="meta">
              Page {currentPage} of {totalPages} · Showing{" "}
              {(currentPage - 1) * DEFAULT_ROWS_PER_PAGE + 1}-
              {Math.min(currentPage * DEFAULT_ROWS_PER_PAGE, visibleRows.length)} of{" "}
              {visibleRows.length}
            </span>
            <div className="workspace-actions">
              <button
                className="secondary-button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((current) => Math.max(1, current - 1))}
                type="button"
              >
                Previous
              </button>
              <button
                className="secondary-button"
                disabled={currentPage === totalPages}
                onClick={() =>
                  setCurrentPage((current) => Math.min(totalPages, current + 1))
                }
                type="button"
              >
                Next
              </button>
            </div>
          </div>
        ) : (
          <div className="snapshot-pagination">
            <span className="meta">Showing {visibleRows.length} row{visibleRows.length === 1 ? "" : "s"}</span>
          </div>
        )
      }
    />
  );
}
