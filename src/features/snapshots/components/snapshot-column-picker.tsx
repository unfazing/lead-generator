"use client";

type SnapshotColumnPickerProps = {
  allColumns: string[];
  isVisible: boolean;
  onToggleVisibility: () => void;
  selectedColumns: string[];
  onToggleColumn: (column: string) => void;
};

export function SnapshotColumnPicker({
  allColumns,
  isVisible,
  onToggleVisibility,
  selectedColumns,
  onToggleColumn,
}: SnapshotColumnPickerProps) {
  if (allColumns.length === 0) {
    return null;
  }

  return (
    <section className="column-picker">
      <div className="column-picker-header">
        <strong>Customize columns</strong>
        <div className="column-picker-header-actions">
          <span className="column-picker-summary-meta">
            {selectedColumns.length} optional visible
          </span>
          <button
            className="secondary-button column-picker-toggle"
            onClick={onToggleVisibility}
            type="button"
          >
            {isVisible ? "Hide controls" : "Show controls"}
          </button>
        </div>
      </div>
      {isVisible ? (
        <>
          <div className="chip-grid column-picker-body">
            {allColumns.map((column) => {
              const active = selectedColumns.includes(column);
              const label = column
                .split("_")
                .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
                .join(" ");

              return (
                <button
                  key={column}
                  className={`chip chip-button${active ? " chip-active" : ""}`}
                  onClick={() => onToggleColumn(column)}
                  type="button"
                >
                  {label}
                </button>
              );
            })}
          </div>
          <p className="field-hint column-picker-note">
            Toggle optional columns already present in the snapshot. This only changes the preview.
          </p>
        </>
      ) : null}
    </section>
  );
}
