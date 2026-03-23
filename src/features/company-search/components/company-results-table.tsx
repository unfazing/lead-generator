import {
  defaultCompanyPreviewColumns,
  defaultOptionalCompanyColumns,
} from "@/lib/apollo/company-filter-definitions";
import type { CompanySnapshotRecord } from "@/lib/db/repositories/company-snapshots";

type CompanyResultsTableProps = {
  snapshot: CompanySnapshotRecord | null;
};

export function CompanyResultsTable({ snapshot }: CompanyResultsTableProps) {
  if (!snapshot) {
    return (
      <div className="card empty-message">
        No company snapshot yet. Use the company search panel to create or reuse
        a snapshot for preview.
      </div>
    );
  }

  const selectedColumns = [
    ...defaultCompanyPreviewColumns,
    ...defaultOptionalCompanyColumns.filter((column) =>
      snapshot.result.availableColumns.includes(column),
    ),
  ];

  return (
    <div className="card">
      <div className="table-meta">
        <span className="badge">
          {snapshot.result.source === "live" ? "Live snapshot" : "Fixture snapshot"}
        </span>
        <span className="meta">
          {snapshot.result.rows.length} row(s) • page {snapshot.result.page}
        </span>
      </div>
      <div className="table-shell">
        <table className="results-table">
          <thead>
            <tr>
              {selectedColumns.map((column) => (
                <th key={column}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {snapshot.result.rows.map((row) => (
              <tr key={row.apollo_id}>
                {selectedColumns.map((column) => (
                  <td key={`${row.apollo_id}-${column}`}>
                    {String(row[column as keyof typeof row] ?? "—")}
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
