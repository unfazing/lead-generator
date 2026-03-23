"use client";

import {
  defaultCompanyPreviewColumns,
} from "@/lib/apollo/company-filter-definitions";
import type { CompanySnapshotRecord } from "@/lib/db/repositories/company-snapshots";
import { DataSnapshotViewer } from "@/features/snapshots/components/data-snapshot-viewer";

type CompanyResultsWorkspaceProps = {
  companySnapshot: CompanySnapshotRecord | null;
};

export function CompanyResultsWorkspace({
  companySnapshot,
}: CompanyResultsWorkspaceProps) {
  return (
    <section>
      <DataSnapshotViewer
        defaultColumns={defaultCompanyPreviewColumns}
        emptyMessage="No company snapshot yet. Use the company search panel to create or reuse a snapshot for preview."
        metaDetail={
          companySnapshot
            ? `${companySnapshot.result.rows.length} row(s) • page ${companySnapshot.result.page}`
            : ""
        }
        params={companySnapshot?.recipeParams ?? {}}
        selectable
        snapshot={companySnapshot}
      />
    </section>
  );
}
