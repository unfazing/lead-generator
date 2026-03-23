"use client";

import { useEffect, useState } from "react";
import {
  defaultCompanyPreviewColumns,
} from "@/lib/apollo/company-filter-definitions";
import type { CompanySnapshotRecord } from "@/lib/db/repositories/company-snapshots";
import type { PeopleSnapshotRecord } from "@/lib/db/repositories/people-snapshots";
import type { PeopleRecipe } from "@/lib/recipes/schema";
import { PeopleResultsTable } from "@/features/people-search/components/people-results-table";
import { PeopleSearchPanel } from "@/features/people-search/components/people-search-panel";
import { SnapshotColumnPicker } from "@/features/snapshots/components/snapshot-column-picker";
import { SnapshotResultsTable } from "@/features/snapshots/components/snapshot-results-table";

type CompanyResultsWorkspaceProps = {
  companyRecipeId: string | null;
  companySnapshot: CompanySnapshotRecord | null;
  peopleRecipe: PeopleRecipe | null;
  peopleSnapshot: PeopleSnapshotRecord | null;
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
  companyRecipeId,
  companySnapshot,
  peopleRecipe,
  peopleSnapshot,
}: CompanyResultsWorkspaceProps) {
  const [selectedOptionalColumns, setSelectedOptionalColumns] = useState<string[]>(
    getInitialOptionalColumns(companySnapshot),
  );
  const [showColumnControls, setShowColumnControls] = useState(false);
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
    <section className="stack">
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
      <PeopleSearchPanel
        companyRecipeId={companyRecipeId ?? ""}
        companySnapshot={companySnapshot}
        peopleRecipe={peopleRecipe}
        selectedCompanyIds={selectedCompanyIds}
      />
      <PeopleResultsTable snapshot={peopleSnapshot} />
    </section>
  );
}
