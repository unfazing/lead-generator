"use client";

type SnapshotVersionOption = {
  id: string;
  label: string;
  href?: string;
};

type SnapshotVersionSelectorProps =
  | {
      activeId: string | null;
      label: string;
      onSelect: (snapshotId: string) => void;
      options: SnapshotVersionOption[];
    }
  | {
      activeId: string | null;
      label: string;
      onSelect?: never;
      options: Array<SnapshotVersionOption & { href: string }>;
    };

export function SnapshotVersionSelector(props: SnapshotVersionSelectorProps) {
  const { activeId, label, options } = props;
  const onSelect = "onSelect" in props ? props.onSelect : undefined;

  return (
    <label className="field">
      <span>{label}</span>
      <select
        className="snapshot-switcher-select"
        onChange={(event) => {
          const nextId = event.target.value;
          if (onSelect) {
            onSelect(nextId);
            return;
          }

          const next = options.find((option) => option.id === nextId);
          if (next?.href) {
            window.location.assign(next.href);
          }
        }}
        value={activeId ?? ""}
      >
        <option value="">Choose a snapshot</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
