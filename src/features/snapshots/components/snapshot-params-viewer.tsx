"use client";

type SnapshotParamsViewerProps = {
  isVisible: boolean;
  onToggleVisibility: () => void;
  params: Record<string, unknown>;
};

function formatValue(value: unknown) {
  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(", ") : "—";
  }

  if (value === undefined || value === null || value === "") {
    return "—";
  }

  if (typeof value === "boolean") {
    return value ? "True" : "False";
  }

  return String(value);
}

function formatLabel(key: string) {
  return key
    .split(/(?=[A-Z])|_/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function SnapshotParamsViewer({
  isVisible,
  onToggleVisibility,
  params,
}: SnapshotParamsViewerProps) {
  const entries = Object.entries(params).filter(([, value]) => {
    if (Array.isArray(value)) {
      return value.length > 0;
    }

    if (typeof value === "string") {
      return value.trim().length > 0;
    }

    return value !== undefined && value !== null;
  });

  return (
    <section className="column-picker">
      <div className="column-picker-header">
        <strong>Snapshot request params</strong>
        <div className="column-picker-header-actions">
          <span className="column-picker-summary-meta">{entries.length} populated</span>
          <button
            className="secondary-button column-picker-toggle"
            onClick={onToggleVisibility}
            type="button"
          >
            {isVisible ? "Hide" : "Show"}
          </button>
        </div>
      </div>
      {isVisible ? (
        entries.length > 0 ? (
          <dl className="snapshot-params-grid">
            {entries.map(([key, value]) => (
              <div key={key} className="snapshot-params-item">
                <dt>{formatLabel(key)}</dt>
                <dd>{formatValue(value)}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="field-hint column-picker-note">
            No populated request params were stored on this snapshot.
          </p>
        )
      ) : null}
    </section>
  );
}
