import React, { type ReactNode } from "react";

type SnapshotResultsTableProps<Row extends { apollo_id: string }> = {
  emptyMessage: string;
  metaLabel: string;
  metaDetail: string;
  rows: Row[];
  selectedColumns: string[];
  source: "live" | "fixture";
  controls?: ReactNode;
  detailPanels?: ReactNode;
  headerActions?: ReactNode;
  summarySlot?: ReactNode;
  selectedRowIds?: string[];
  onToggleRow?: (rowId: string) => void;
  sortColumn?: string | null;
  sortDirection?: "asc" | "desc";
  onToggleSort?: (column: string) => void;
};

export function SnapshotResultsTable<Row extends { apollo_id: string }>({
  emptyMessage,
  metaLabel,
  metaDetail,
  rows,
  selectedColumns,
  source,
  controls,
  detailPanels,
  headerActions,
  summarySlot,
  selectedRowIds = [],
  onToggleRow,
  sortColumn = null,
  sortDirection = "asc",
  onToggleSort,
}: SnapshotResultsTableProps<Row>) {
  if (rows.length === 0 && !metaDetail) {
    return <div className="card empty-message">{emptyMessage}</div>;
  }

  return (
    <div className="card stack">
      <div className="table-toolbar">
        <div className="table-meta">
          <span className="badge">
            {source === "live" ? "Live snapshot" : "Fixture snapshot"}
          </span>
          <span className="meta">{metaLabel}</span>
          <span className="meta">{metaDetail}</span>
        </div>
        {headerActions ? (
          <div className="table-toolbar-actions">{headerActions}</div>
        ) : null}
      </div>
      {controls || detailPanels ? (
        <div className="table-toolbar-panel snapshot-toolbar-stack">
          {controls}
          {detailPanels}
        </div>
      ) : null}
      {summarySlot ? <div className="table-toolbar-panel">{summarySlot}</div> : null}
      <div className="table-shell">
        <table className="results-table">
          <thead>
            <tr>
              {onToggleRow ? <th>Select</th> : null}
              {selectedColumns.map((column) => (
                <th key={column}>
                  {onToggleSort ? (
                    <button
                      className={`table-sort-button${
                        sortColumn === column ? " active" : ""
                      }`}
                      onClick={() => onToggleSort(column)}
                      type="button"
                    >
                      <span>{column}</span>
                      {sortColumn === column ? (
                        <span>{sortDirection === "asc" ? "↑" : "↓"}</span>
                      ) : null}
                    </button>
                  ) : (
                    column
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.apollo_id}>
                {onToggleRow ? (
                  <td>
                    <input
                      checked={selectedRowIds.includes(row.apollo_id)}
                      onChange={() => onToggleRow(row.apollo_id)}
                      type="checkbox"
                    />
                  </td>
                ) : null}
                {selectedColumns.map((column) => (
                  <td key={`${row.apollo_id}-${column}`}>
                    {String(row[column as keyof Row] ?? "—")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
