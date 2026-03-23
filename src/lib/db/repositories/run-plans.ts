import { randomUUID } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { ensureDataDirectory } from "@/lib/db/client";
import type { RunPlanStatus } from "@/lib/db/schema/run-plans";

export type RunPlanRecord = {
  id: string;
  companyRecipeId: string;
  peopleRecipeId: string;
  companySnapshotId: string;
  peopleSnapshotId: string;
  maxContacts: number;
  estimatedContacts: number;
  estimateSummary: string;
  estimateNote: string;
  status: RunPlanStatus;
  confirmedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

const runPlanFilePath = path.join(process.cwd(), "data", "run-plans.json");

async function readRunPlans() {
  try {
    const contents = await readFile(runPlanFilePath, "utf8");
    return JSON.parse(contents) as RunPlanRecord[];
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

async function writeRunPlans(records: RunPlanRecord[]) {
  await ensureDataDirectory();
  await writeFile(runPlanFilePath, JSON.stringify(records, null, 2), "utf8");
}

export async function getLatestRunPlanForPeopleSnapshot(peopleSnapshotId: string) {
  const records = await readRunPlans();
  return (
    records
      .filter((record) => record.peopleSnapshotId === peopleSnapshotId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0] ?? null
  );
}

export async function saveRunPlan(
  input: Omit<RunPlanRecord, "id" | "createdAt" | "updatedAt" | "confirmedAt" | "status">,
) {
  const records = await readRunPlans();
  const now = new Date().toISOString();
  const existing = records.find(
    (record) => record.peopleSnapshotId === input.peopleSnapshotId,
  );

  if (existing) {
    const updated: RunPlanRecord = {
      ...existing,
      ...input,
      status: "draft",
      confirmedAt: null,
      updatedAt: now,
    };
    await writeRunPlans(
      records.map((record) => (record.id === updated.id ? updated : record)),
    );
    return updated;
  }

  const created: RunPlanRecord = {
    id: randomUUID(),
    ...input,
    status: "draft",
    confirmedAt: null,
    createdAt: now,
    updatedAt: now,
  };
  await writeRunPlans([...records, created]);
  return created;
}

export async function markRunPlanReady(runPlanId: string) {
  const records = await readRunPlans();
  const existing = records.find((record) => record.id === runPlanId);

  if (!existing) {
    throw new Error("Run plan not found");
  }

  const now = new Date().toISOString();
  const updated: RunPlanRecord = {
    ...existing,
    status: "ready",
    confirmedAt: now,
    updatedAt: now,
  };
  await writeRunPlans(
    records.map((record) => (record.id === runPlanId ? updated : record)),
  );
  return updated;
}
