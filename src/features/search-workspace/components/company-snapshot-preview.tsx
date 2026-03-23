"use client";

import type { ReactNode } from "react";
import {
  defaultCompanyPreviewColumns,
} from "@/lib/apollo/company-filter-definitions";
import type { CompanySnapshotRecord } from "@/lib/db/repositories/company-snapshots";
import { DataSnapshotViewer } from "@/features/snapshots/components/data-snapshot-viewer";

type CompanySnapshotPreviewProps = {
  snapshot: CompanySnapshotRecord | null;
  selectable?: boolean;
  summarySlot?: ReactNode;
  onSelectionChange?: (companyIds: string[]) => void;
};

export function CompanySnapshotPreview({
  snapshot,
  selectable = false,
  summarySlot,
  onSelectionChange,
}: CompanySnapshotPreviewProps) {
  return (
    <DataSnapshotViewer
      defaultColumns={defaultCompanyPreviewColumns}
      emptyMessage="No company snapshot is loaded yet. Run a live search or reopen a stored snapshot."
      metaDetail={snapshot ? `${snapshot.result.rows.length} row(s) • page ${snapshot.result.page}` : ""}
      onSelectionChange={onSelectionChange}
      params={snapshot?.recipeParams ?? {}}
      selectable={selectable}
      snapshot={snapshot}
      summarySlot={summarySlot}
    />
  );
}
