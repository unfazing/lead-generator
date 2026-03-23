import { randomUUID } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { ensureDataDirectory } from "@/lib/db/client";
import {
  type CompanySearchResult,
} from "@/lib/apollo/company-search";
import {
  companySearchPayloadSchema,
  type CompanySearchPayload,
} from "@/lib/company-search/schema";

export type CompanySnapshotRecord = {
  id: string;
  recipeId: string;
  signature: string;
  recipeParams: CompanySearchPayload;
  createdAt: string;
  updatedAt: string;
  result: CompanySearchResult;
};

const snapshotFilePath = path.join(process.cwd(), "data", "company-snapshots.json");

async function readSnapshots() {
  try {
    const contents = await readFile(snapshotFilePath, "utf8");
    const parsed = JSON.parse(contents) as Array<
      Omit<CompanySnapshotRecord, "recipeParams"> & {
        recipeParams?: CompanySearchPayload;
      }
    >;

    return parsed.map((record) => ({
      ...record,
      recipeParams: companySearchPayloadSchema.parse(
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

async function writeSnapshots(records: CompanySnapshotRecord[]) {
  await ensureDataDirectory();
  await writeFile(snapshotFilePath, JSON.stringify(records, null, 2), "utf8");
}

export async function listSnapshotsForRecipe(recipeId: string) {
  const records = await readSnapshots();
  return records
    .filter((record) => record.recipeId === recipeId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getCompanySnapshotById(snapshotId: string) {
  const records = await readSnapshots();
  return records.find((record) => record.id === snapshotId) ?? null;
}

export async function deleteCompanySnapshotsForRecipe(recipeId: string) {
  const records = await readSnapshots();
  const remaining = records.filter((record) => record.recipeId !== recipeId);
  await writeSnapshots(remaining);
}

export async function getLatestSnapshotForSignature(
  recipeId: string,
  signature: string,
) {
  const records = await readSnapshots();

  return (
    records
      .filter(
        (record) =>
          record.recipeId === recipeId && record.signature === signature,
      )
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0] ?? null
  );
}

export async function saveCompanySnapshot(
  recipeId: string,
  result: CompanySearchResult,
) {
  const records = await readSnapshots();
  const now = new Date().toISOString();
  const recipeParams = companySearchPayloadSchema.parse(result.request);
  const existing = records.find(
    (record) =>
      record.recipeId === recipeId && record.signature === result.signature,
  );

  if (existing) {
    const updated: CompanySnapshotRecord = {
      ...existing,
      recipeParams,
      updatedAt: now,
      result,
    };

    await writeSnapshots(
      records.map((record) => (record.id === updated.id ? updated : record)),
    );

    return updated;
  }

  const created: CompanySnapshotRecord = {
    id: randomUUID(),
    recipeId,
    signature: result.signature,
    recipeParams,
    createdAt: now,
    updatedAt: now,
    result,
  };

  await writeSnapshots([...records, created]);
  return created;
}
