"use client";

import type { OptionalCompanyColumn } from "@/lib/apollo/company-filter-definitions";

type CompanyColumnPickerProps = {
  allColumns: OptionalCompanyColumn[];
  selectedColumns: OptionalCompanyColumn[];
  onToggleColumn: (column: OptionalCompanyColumn) => void;
};

export function CompanyColumnPicker({
  allColumns,
  selectedColumns,
  onToggleColumn,
}: CompanyColumnPickerProps) {
  if (allColumns.length === 0) {
    return null;
  }

  return (
    <details className="card stack details-card">
      <summary className="column-picker-summary">Optional company columns</summary>
      <div className="chip-grid">
        {allColumns.map((column) => {
          const active = selectedColumns.includes(column);

          return (
            <button
              key={column}
              className={`chip chip-button${active ? " chip-active" : ""}`}
              onClick={() => onToggleColumn(column)}
              type="button"
            >
              {column}
            </button>
          );
        })}
      </div>
      <p className="field-hint">
        Toggle optional columns already present in the snapshot. This only changes the preview.
      </p>
    </details>
  );
}
