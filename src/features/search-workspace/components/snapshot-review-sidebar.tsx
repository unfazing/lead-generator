"use client";

import { useRouter } from "next/navigation";

type SnapshotOption = {
  id: string;
  label: string;
  href: string;
};

type SnapshotReviewSidebarProps = {
  recipeEyebrow: string;
  recipeName: string;
  snapshotLabel: string;
  activeSnapshotId: string;
  options: SnapshotOption[];
};

export function SnapshotReviewSidebar({
  recipeEyebrow,
  recipeName,
  snapshotLabel,
  activeSnapshotId,
  options,
}: SnapshotReviewSidebarProps) {
  const router = useRouter();

  return (
    <section className="card recipe-rail">
      <div className="recipe-rail-header">
        <div className="workspace-header">
          <p className="eyebrow">{recipeEyebrow}</p>
          <h2>{recipeName}</h2>
        </div>
        <span className="badge">{options.length} saved</span>
      </div>
      <div className="field">
        <label htmlFor={`snapshot-switcher-${activeSnapshotId}`}>{snapshotLabel}</label>
        <select
          className="snapshot-switcher-select"
          id={`snapshot-switcher-${activeSnapshotId}`}
          onChange={(event) => {
            const next = options.find((option) => option.id === event.target.value);
            if (next) {
              router.push(next.href);
            }
          }}
          value={activeSnapshotId}
        >
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </section>
  );
}
