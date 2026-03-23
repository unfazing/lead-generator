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

export type PeopleSnapshotRecord = {
  id: string;
  companyRecipeId: string;
  companySnapshotId: string;
  peopleRecipeId: string;
  recipeParams: PeopleSearchPayload;
  selectionMode: PeopleSnapshotSelectionMode;
  selectedCompanyIds: string[];
  signature: string;
  createdAt: string;
  updatedAt: string;
  result: PeopleSearchResult;
};

const snapshotFilePath = path.join(process.cwd(), "data", "people-snapshots.json");

async function readSnapshots() {
  try {
    const contents = await readFile(snapshotFilePath, "utf8");
    const parsed = JSON.parse(contents) as Array<
      Omit<PeopleSnapshotRecord, "recipeParams"> & {
        recipeParams?: PeopleSearchPayload;
      }
    >;

    return parsed.map((record) => ({
      ...record,
      recipeParams: peopleSearchPayloadSchema.parse(
        record.recipeParams ?? record.result.request,
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

export async function savePeopleSnapshot(
  meta: {
    companyRecipeId: string;
    companySnapshotId: string;
    peopleRecipeId: string;
    recipeParams: PeopleSearchPayload;
    selectionMode: PeopleSnapshotSelectionMode;
    selectedCompanyIds: string[];
  },
  result: PeopleSearchResult,
) {
  const records = await readSnapshots();
  const now = new Date().toISOString();
  const recipeParams = peopleSearchPayloadSchema.parse(meta.recipeParams);
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
    signature: result.signature,
    createdAt: now,
    updatedAt: now,
    result,
  };

  await writeSnapshots([...records, created]);
  return created;
}
