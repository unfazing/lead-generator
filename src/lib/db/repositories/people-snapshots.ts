import { randomUUID } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { ensureDataDirectory } from "@/lib/db/client";
import type { PeopleSearchResult } from "@/lib/apollo/people-search";
import type { PeopleSnapshotSelectionMode } from "@/lib/db/schema/people-snapshots";
import {
  peopleSearchPayloadSchema,
  type PeopleSearchPayload,
} from "@/lib/people-search/schema";
import {
  peopleRecipeOrganizationImportSchema,
  type PeopleRecipeOrganizationImport,
} from "@/lib/recipes/schema";

export type PeopleSnapshotRecord = {
  id: string;
  companyRecipeId: string;
  companySnapshotId: string;
  peopleRecipeId: string;
  recipeParams: PeopleSearchPayload;
  selectionMode: PeopleSnapshotSelectionMode;
  selectedCompanyIds: string[];
  organizationImports: PeopleRecipeOrganizationImport[];
  signature: string;
  createdAt: string;
  updatedAt: string;
  result: PeopleSearchResult;
};

const snapshotFilePath = path.join(process.cwd(), "data", "people-snapshots.json");

function normalizeOrganizationImports(imports: PeopleRecipeOrganizationImport[]) {
  return peopleRecipeOrganizationImportSchema
    .array()
    .parse(imports)
    .map((entry) => ({
      ...entry,
      organizationIds: Array.from(new Set(entry.organizationIds)).sort(),
      selectedCompanyIds: Array.from(new Set(entry.selectedCompanyIds)).sort(),
    }))
    .sort((a, b) => a.snapshotId.localeCompare(b.snapshotId));
}

async function readSnapshots() {
  try {
    const contents = await readFile(snapshotFilePath, "utf8");
    const parsed = JSON.parse(contents) as Array<
      Omit<PeopleSnapshotRecord, "recipeParams"> & {
        recipeParams?: PeopleSearchPayload;
        organizationImports?: PeopleRecipeOrganizationImport[];
      }
    >;

    return parsed.map((record) => ({
      ...record,
      recipeParams: peopleSearchPayloadSchema.parse(
        record.recipeParams ?? record.result.request,
      ),
      organizationImports: normalizeOrganizationImports(
        record.organizationImports ?? [],
      ),
    }));
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      (error as NodeJS.ErrnoException).code === "ENOENT"
    ) {
      return [];
    }

    throw error;
  }
}

async function writeSnapshots(records: PeopleSnapshotRecord[]) {
  await ensureDataDirectory();
  await writeFile(snapshotFilePath, JSON.stringify(records, null, 2), "utf8");
}

export async function listPeopleSnapshotsForContext(
  peopleRecipeId: string,
  companySnapshotId: string,
) {
  const records = await readSnapshots();
  return records
    .filter(
      (record) =>
        record.peopleRecipeId === peopleRecipeId &&
        record.companySnapshotId === companySnapshotId,
    )
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function listPeopleSnapshotsForRecipe(peopleRecipeId: string) {
  const records = await readSnapshots();
  return records
    .filter((record) => record.peopleRecipeId === peopleRecipeId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getPeopleSnapshotById(snapshotId: string) {
  const records = await readSnapshots();
  return records.find((record) => record.id === snapshotId) ?? null;
}

export async function deletePeopleSnapshotsForRecipe(peopleRecipeId: string) {
  const records = await readSnapshots();
  const remaining = records.filter(
    (record) => record.peopleRecipeId !== peopleRecipeId,
  );
  await writeSnapshots(remaining);
}

export async function deletePeopleSnapshotsForCompanyRecipe(companyRecipeId: string) {
  const records = await readSnapshots();
  const remaining = records.filter(
    (record) => record.companyRecipeId !== companyRecipeId,
  );
  await writeSnapshots(remaining);
}

export async function savePeopleSnapshot(
  meta: {
    companyRecipeId: string;
    companySnapshotId: string;
    peopleRecipeId: string;
    recipeParams: PeopleSearchPayload;
    selectionMode: PeopleSnapshotSelectionMode;
    selectedCompanyIds: string[];
    organizationImports: PeopleRecipeOrganizationImport[];
  },
  result: PeopleSearchResult,
) {
  const records = await readSnapshots();
  const now = new Date().toISOString();
  const recipeParams = peopleSearchPayloadSchema.parse(meta.recipeParams);
  const organizationImports = normalizeOrganizationImports(meta.organizationImports);
  const existing = records.find(
    (record) =>
      record.signature === result.signature &&
      record.companySnapshotId === meta.companySnapshotId &&
      record.peopleRecipeId === meta.peopleRecipeId,
  );

  if (existing) {
    const updated: PeopleSnapshotRecord = {
      ...existing,
      recipeParams,
      updatedAt: now,
      selectedCompanyIds: meta.selectedCompanyIds,
      selectionMode: meta.selectionMode,
      organizationImports,
      result,
    };
    await writeSnapshots(
      records.map((record) => (record.id === updated.id ? updated : record)),
    );
    return updated;
  }

  const created: PeopleSnapshotRecord = {
    id: randomUUID(),
    companyRecipeId: meta.companyRecipeId,
    companySnapshotId: meta.companySnapshotId,
    peopleRecipeId: meta.peopleRecipeId,
    recipeParams,
    selectionMode: meta.selectionMode,
    selectedCompanyIds: meta.selectedCompanyIds,
    organizationImports,
    signature: result.signature,
    createdAt: now,
    updatedAt: now,
    result,
  };

  await writeSnapshots([...records, created]);
  return created;
}
