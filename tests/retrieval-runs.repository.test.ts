import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  acquireRetrievalRunLease,
  createRetrievalRunFromPlan,
  getLatestRetrievalRunForPeopleSnapshot,
  getRetrievalRunById,
  releaseRetrievalRunLease,
  updateRetrievalRun,
} from "@/lib/db/repositories/retrieval-runs";
import {
  listRetrievalRunItems,
  seedRetrievalRunItems,
  updateRetrievalRunItems,
} from "@/lib/db/repositories/retrieval-run-items";

const dataDir = path.join(process.cwd(), "data");
const runsFile = path.join(dataDir, "retrieval-runs.json");
const itemsFile = path.join(dataDir, "retrieval-run-items.json");
const backupSuffix = ".bak.test";

const retrievalInput = {
  companyRecipeId: "company-recipe-1",
  peopleRecipeId: "people-recipe-1",
  companySnapshotId: "company-snapshot-1",
  peopleSnapshotId: "people-snapshot-1",
  maxContacts: 3,
  estimatedContacts: 3,
  estimateSummary: "3 contacts estimated",
  estimateNote: "fixture",
};

async function backupFile(filePath: string) {
  try {
    await rm(`${filePath}${backupSuffix}`, { force: true });
    const contents = await readFile(filePath, "utf8");
    await writeFile(`${filePath}${backupSuffix}`, contents, "utf8");
  } catch {
    // No existing file to preserve.
  }
}

async function restoreFile(filePath: string) {
  try {
    const contents = await readFile(`${filePath}${backupSuffix}`, "utf8");
    await writeFile(filePath, contents, "utf8");
    await rm(`${filePath}${backupSuffix}`, { force: true });
  } catch {
    await rm(filePath, { force: true });
  }
}

describe("retrieval-runs repository", () => {
  beforeEach(async () => {
    await mkdir(dataDir, { recursive: true });
    await backupFile(runsFile);
    await backupFile(itemsFile);
    await rm(runsFile, { force: true });
    await rm(itemsFile, { force: true });
  });

  afterEach(async () => {
    await restoreFile(runsFile);
    await restoreFile(itemsFile);
  });

  it("creates a durable retrieval run plus item rows without mutating the run-plan estimate", async () => {
    const run = await createRetrievalRunFromPlan(
      retrievalInput,
      retrievalInput.maxContacts,
    );
    const items = await seedRetrievalRunItems(
      run.id,
      [
        {
          apollo_id: "person-1",
          full_name: "Avery Ng",
          title: "Head of Sales",
          company_name: "Acme",
          location: "Singapore",
          seniority: "director",
        },
        {
          apollo_id: "person-2",
          full_name: "Jordan Lee",
          title: "Founder",
          company_name: "Orbit",
          location: "Sydney",
          seniority: "founder",
        },
      ],
      retrievalInput.maxContacts,
    );

    expect(run.totalItems).toBe(3);
    expect(items).toHaveLength(2);
    expect(retrievalInput.estimatedContacts).toBe(3);
  });

  it("persists batch counters, heartbeat state, and terminal item outcomes across reloads", async () => {
    const run = await createRetrievalRunFromPlan(retrievalInput, 2);
    await seedRetrievalRunItems(
      run.id,
      [
        {
          apollo_id: "person-1",
          full_name: "Avery Ng",
          title: "Head of Sales",
          company_name: "Acme",
          location: "Singapore",
          seniority: "director",
        },
        {
          apollo_id: "person-2",
          full_name: "Jordan Lee",
          title: "Founder",
          company_name: "Orbit",
          location: "Sydney",
          seniority: "founder",
        },
      ],
      2,
    );

    await updateRetrievalRun(run.id, (current) => ({
      ...current,
      status: "active",
      processedItems: 2,
      successfulItems: 1,
      failedItems: 1,
      reusedItems: 1,
      newlyEnrichedItems: 1,
      apolloRequestedItems: 1,
      pendingItems: 0,
      processingItems: 0,
      currentBatchSize: 2,
      batchCount: 1,
      lastHeartbeatAt: new Date().toISOString(),
      lastCheckpointAt: new Date().toISOString(),
    }));
    await updateRetrievalRunItems(run.id, (current) =>
      current.map((item, index) => ({
        ...item,
        status: "completed",
        quality: index === 0 ? "verified_business_email" : "unavailable",
        email: index === 0 ? "avery@acme.com" : null,
        emailStatus: index === 0 ? "verified" : "unavailable",
        completedAt: new Date().toISOString(),
      })),
    );

    const persistedRun = await getRetrievalRunById(run.id);
    const persistedItems = await listRetrievalRunItems(run.id);

    expect(persistedRun?.processedItems).toBe(2);
    expect(persistedRun?.batchCount).toBe(1);
    expect(persistedRun?.reusedItems).toBe(1);
    expect(persistedRun?.newlyEnrichedItems).toBe(1);
    expect(persistedRun?.apolloRequestedItems).toBe(1);
    expect(persistedRun?.lastHeartbeatAt).toBeTruthy();
    expect(persistedItems.every((item) => item.status === "completed")).toBe(true);
  });

  it("prevents a second run from acquiring the active lease while one is still held", async () => {
    const runA = await createRetrievalRunFromPlan(retrievalInput, 1);
    const runB = await createRetrievalRunFromPlan(
      { ...retrievalInput, peopleSnapshotId: "people-snapshot-2" },
      1,
    );

    await acquireRetrievalRunLease(runA.id, "holder-a");

    await expect(acquireRetrievalRunLease(runB.id, "holder-b")).rejects.toThrow(
      /active lease/,
    );

    await releaseRetrievalRunLease(runA.id);
    await expect(acquireRetrievalRunLease(runB.id, "holder-b")).resolves.toMatchObject({
      id: runB.id,
    });
  });

  it("recovers from malformed storage through schema-validated reads", async () => {
    await writeFile(runsFile, "{bad json", "utf8");
    await writeFile(itemsFile, "{bad json", "utf8");

    const latestRun = await getLatestRetrievalRunForPeopleSnapshot(
      retrievalInput.peopleSnapshotId,
    );
    const items = await listRetrievalRunItems("missing");

    expect(latestRun).toBeNull();
    expect(items).toEqual([]);
  });
});
