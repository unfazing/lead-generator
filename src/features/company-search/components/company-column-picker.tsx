type CompanyColumnPickerProps = {
  allColumns: string[];
  selectedColumns: string[];
};

export function CompanyColumnPicker({
  allColumns,
  selectedColumns,
}: CompanyColumnPickerProps) {
  if (allColumns.length === 0) {
    return null;
  }

  return (
    <details className="card">
      <summary className="column-picker-summary">Optional company columns</summary>
      <div className="chip-grid">
        {allColumns.map((column) => {
          const active = selectedColumns.includes(column);

          return (
            <span key={column} className={`chip${active ? " chip-active" : ""}`}>
              {column}
            </span>
          );
        })}
      </div>
      <p className="field-hint">
        Optional columns come from stored snapshot data so preview inspection
        does not trigger another Apollo call.
      </p>
    </details>
  );
}
