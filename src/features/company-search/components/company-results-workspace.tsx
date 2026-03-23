"use client";

import { useEffect, useState } from "react";
import {
  defaultCompanyPreviewColumns,
  defaultOptionalCompanyColumns,
  type OptionalCompanyColumn,
} from "@/lib/apollo/company-filter-definitions";
import type { CompanySnapshotRecord } from "@/lib/db/repositories/company-snapshots";
import type { PeopleSnapshotRecord } from "@/lib/db/repositories/people-snapshots";
import type { PeopleRecipe } from "@/lib/recipes/schema";
import { CompanyColumnPicker } from "@/features/company-search/components/company-column-picker";
import { CompanyResultsTable } from "@/features/company-search/components/company-results-table";
import { PeopleResultsTable } from "@/features/people-search/components/people-results-table";
import { PeopleSearchPanel } from "@/features/people-search/components/people-search-panel";

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

  return defaultOptionalCompanyColumns.filter((column) =>
    snapshot.result.availableColumns.includes(column),
  );
}

export function CompanyResultsWorkspace({
  companyRecipeId,
  companySnapshot,
  peopleRecipe,
  peopleSnapshot,
}: CompanyResultsWorkspaceProps) {
  const [selectedOptionalColumns, setSelectedOptionalColumns] = useState(
    getInitialOptionalColumns(companySnapshot),
  );
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<string[]>([]);

  const availableOptionalColumns = companySnapshot
    ? defaultOptionalCompanyColumns.filter((column) =>
        companySnapshot.result.availableColumns.includes(column),
      )
    : [...defaultOptionalCompanyColumns];

  const selectedColumns = [
    ...defaultCompanyPreviewColumns,
    ...selectedOptionalColumns,
  ];

  useEffect(() => {
    setSelectedOptionalColumns(getInitialOptionalColumns(companySnapshot));
    setSelectedCompanyIds([]);
  }, [companySnapshot]);

  function handleToggleColumn(column: OptionalCompanyColumn) {
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
      <CompanyColumnPicker
        allColumns={availableOptionalColumns}
        onToggleColumn={handleToggleColumn}
        selectedColumns={selectedOptionalColumns}
      />
      <CompanyResultsTable
        onToggleCompany={handleToggleCompany}
        selectedColumns={selectedColumns}
        selectedCompanyIds={selectedCompanyIds}
        snapshot={companySnapshot}
      />
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
