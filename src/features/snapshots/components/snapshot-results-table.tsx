import type { ReactNode } from "react";

type SnapshotResultsTableProps<Row extends { apollo_id: string }> = {
  emptyMessage: string;
  metaLabel: string;
  metaDetail: string;
  rows: Row[];
  selectedColumns: string[];
  source: "live" | "fixture";
  columnPicker?: ReactNode;
  paramsViewer?: ReactNode;
  selectedRowIds?: string[];
  onToggleRow?: (rowId: string) => void;
};

export function SnapshotResultsTable<Row extends { apollo_id: string }>({
  emptyMessage,
  metaLabel,
  metaDetail,
  rows,
  selectedColumns,
  source,
  columnPicker,
  paramsViewer,
  selectedRowIds = [],
  onToggleRow,
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
      </div>
      {columnPicker || paramsViewer ? (
        <div className="table-toolbar-panel">
          {paramsViewer}
          {columnPicker}
        </div>
      ) : null}
      <div className="table-shell">
        <table className="results-table">
          <thead>
            <tr>
              {onToggleRow ? <th>Select</th> : null}
              {selectedColumns.map((column) => (
                <th key={column}>{column}</th>
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
