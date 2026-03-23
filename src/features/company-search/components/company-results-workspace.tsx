"use client";

import { useEffect, useState } from "react";
import {
  defaultCompanyPreviewColumns,
  defaultOptionalCompanyColumns,
  type OptionalCompanyColumn,
} from "@/lib/apollo/company-filter-definitions";
import type { CompanySnapshotRecord } from "@/lib/db/repositories/company-snapshots";
import { CompanyColumnPicker } from "@/features/company-search/components/company-column-picker";
import { CompanyResultsTable } from "@/features/company-search/components/company-results-table";

type CompanyResultsWorkspaceProps = {
  snapshot: CompanySnapshotRecord | null;
};

function getInitialOptionalColumns(snapshot: CompanySnapshotRecord | null) {
  if (!snapshot) {
    return [];
  }

  return defaultOptionalCompanyColumns.filter((column) =>
    snapshot.result.availableColumns.includes(column),
  );
}

export function CompanyResultsWorkspace({
  snapshot,
}: CompanyResultsWorkspaceProps) {
  const [selectedOptionalColumns, setSelectedOptionalColumns] = useState(
    getInitialOptionalColumns(snapshot),
  );

  const availableOptionalColumns = snapshot
    ? defaultOptionalCompanyColumns.filter((column) =>
        snapshot.result.availableColumns.includes(column),
      )
    : [...defaultOptionalCompanyColumns];

  const selectedColumns = [
    ...defaultCompanyPreviewColumns,
    ...selectedOptionalColumns,
  ];

  useEffect(() => {
    setSelectedOptionalColumns(getInitialOptionalColumns(snapshot));
  }, [snapshot]);

  function handleToggleColumn(column: OptionalCompanyColumn) {
    setSelectedOptionalColumns((current) =>
      current.includes(column)
        ? current.filter((value) => value !== column)
        : [...current, column],
    );
  }

  return (
    <section className="stack">
      <CompanyColumnPicker
        allColumns={availableOptionalColumns}
        onToggleColumn={handleToggleColumn}
        selectedColumns={selectedOptionalColumns}
      />
      <CompanyResultsTable
        selectedColumns={selectedColumns}
        snapshot={snapshot}
      />
    </section>
  );
}
