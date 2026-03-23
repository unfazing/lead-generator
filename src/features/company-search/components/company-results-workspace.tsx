"use client";

import { useEffect, useState } from "react";
import {
  defaultCompanyPreviewColumns,
} from "@/lib/apollo/company-filter-definitions";
import type { CompanySnapshotRecord } from "@/lib/db/repositories/company-snapshots";
import { SnapshotColumnPicker } from "@/features/snapshots/components/snapshot-column-picker";
import { SnapshotParamsViewer } from "@/features/snapshots/components/snapshot-params-viewer";
import { SnapshotResultsTable } from "@/features/snapshots/components/snapshot-results-table";

type CompanyResultsWorkspaceProps = {
  companySnapshot: CompanySnapshotRecord | null;
};

function getInitialOptionalColumns(snapshot: CompanySnapshotRecord | null) {
  if (!snapshot) {
    return [];
  }

  return snapshot.result.availableColumns.filter(
    (column) =>
      !defaultCompanyPreviewColumns.includes(
        column as (typeof defaultCompanyPreviewColumns)[number],
      ),
  );
}

export function CompanyResultsWorkspace({
  companySnapshot,
}: CompanyResultsWorkspaceProps) {
  const [selectedOptionalColumns, setSelectedOptionalColumns] = useState<string[]>(
    getInitialOptionalColumns(companySnapshot),
  );
  const [showColumnControls, setShowColumnControls] = useState(false);
  const [showParams, setShowParams] = useState(false);
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<string[]>([]);

  const availableOptionalColumns = companySnapshot
    ? companySnapshot.result.availableColumns.filter(
        (column) =>
          !defaultCompanyPreviewColumns.includes(
            column as (typeof defaultCompanyPreviewColumns)[number],
          ),
      )
    : [];

  const selectedColumns = [
    ...defaultCompanyPreviewColumns,
    ...selectedOptionalColumns,
  ];

  useEffect(() => {
    setSelectedOptionalColumns(getInitialOptionalColumns(companySnapshot));
    setShowParams(false);
    setSelectedCompanyIds([]);
  }, [companySnapshot]);

  function handleToggleColumn(column: string) {
    setSelectedOptionalColumns((current) =>
      current.includes(column)
        ? current.filter((value) => value !== column)
        : [...current, column],
    );
  }

  function handleToggleCompany(companyId: string) {
    setSelectedCompanyIds((current) =>
      current.includes(companyId)
        ? current.filter((value) => value !== companyId)
        : [...current, companyId],
    );
  }

  return (
    <section>
      {companySnapshot ? (
        <SnapshotResultsTable
          columnPicker={
            <SnapshotColumnPicker
              allColumns={availableOptionalColumns}
              isVisible={showColumnControls}
              onToggleColumn={handleToggleColumn}
              onToggleVisibility={() =>
                setShowColumnControls((current) => !current)
              }
              selectedColumns={selectedOptionalColumns}
            />
          }
          paramsViewer={
            <SnapshotParamsViewer
              isVisible={showParams}
              onToggleVisibility={() => setShowParams((current) => !current)}
              params={companySnapshot.recipeParams}
            />
          }
          emptyMessage="No company snapshot yet. Use the company search panel to create or reuse a snapshot for preview."
          metaDetail={`${companySnapshot.result.rows.length} row(s) • page ${companySnapshot.result.page}`}
          metaLabel=""
          onToggleRow={handleToggleCompany}
          rows={companySnapshot.result.rows}
          selectedColumns={selectedColumns}
          selectedRowIds={selectedCompanyIds}
          source={companySnapshot.result.source}
        />
      ) : (
        <div className="card empty-message">
          No company snapshot yet. Use the company search panel to create or reuse
          a snapshot for preview.
        </div>
      )}
    </section>
  );
}
