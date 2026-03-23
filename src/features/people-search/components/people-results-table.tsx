import type { PeopleSnapshotRecord } from "@/lib/db/repositories/people-snapshots";

type PeopleResultsTableProps = {
  snapshot: PeopleSnapshotRecord | null;
};

const defaultColumns = [
  "full_name",
  "title",
  "company_name",
  "location",
  "seniority",
  "department",
] as const;

export function PeopleResultsTable({ snapshot }: PeopleResultsTableProps) {
  if (!snapshot) {
    return (
      <div className="card empty-message">
        No people snapshot yet. Run people search from the current company and people recipe pairing.
      </div>
    );
  }

  return (
    <section className="card stack">
      <div className="table-meta">
        <span className="badge">
          {snapshot.selectionMode === "all" ? "All companies" : "Selected companies"}
        </span>
        <span className="meta">
          {snapshot.result.rows.length} people • source {snapshot.result.source}
        </span>
      </div>
      <div className="table-shell">
        <table className="results-table">
          <thead>
            <tr>
              {defaultColumns.map((column) => (
                <th key={column}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {snapshot.result.rows.map((row) => (
              <tr key={row.apollo_id}>
                {defaultColumns.map((column) => (
                  <td key={`${row.apollo_id}-${column}`}>
                    {String(row[column as keyof typeof row] ?? "—")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
