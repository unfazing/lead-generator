import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createRetrievalRunFromPlan, updateRetrievalRun } from "@/lib/db/repositories/retrieval-runs";
import { seedRetrievalRunItems, updateRetrievalRunItems } from "@/lib/db/repositories/retrieval-run-items";
import { buildRetrievalRunSummary } from "@/lib/retrieval/run-summary";

const dataDir = path.join(process.cwd(), "data");
const managedFiles = ["retrieval-runs.json", "retrieval-run-items.json"] as const;
const backupSuffix = ".bak.test";

const retrievalInput = {
  companyRecipeId: "company-recipe-1",
  peopleRecipeId: "people-recipe-1",
  companySnapshotId: "company-snapshot-1",
  peopleSnapshotId: "people-snapshot-1",
  maxContacts: 10,
  estimatedContacts: 6,
  estimateSummary: "6 contacts estimated",
  estimateNote: "fixture",
};

async function backupManagedFiles() {
  await mkdir(dataDir, { recursive: true });
  for (const fileName of managedFiles) {
    const filePath = path.join(dataDir, fileName);
    try {
      await rm(`${filePath}${backupSuffix}`, { force: true });
      const contents = await readFile(filePath, "utf8");
      await writeFile(`${filePath}${backupSuffix}`, contents, "utf8");
    } catch {
      // No existing file to preserve.
    }
    await rm(filePath, { force: true });
  }
}

async function restoreManagedFiles() {
  for (const fileName of managedFiles) {
    const filePath = path.join(dataDir, fileName);
    try {
      const contents = await readFile(`${filePath}${backupSuffix}`, "utf8");
      await writeFile(filePath, contents, "utf8");
      await rm(`${filePath}${backupSuffix}`, { force: true });
    } catch {
      await rm(filePath, { force: true });
    }
  }
}

describe("retrieval usage summary", () => {
  beforeEach(async () => {
    await backupManagedFiles();
  });

  afterEach(async () => {
    await restoreManagedFiles();
  });

  it("reports immutable estimate values alongside actual persisted usage counts", async () => {
    const run = await createRetrievalRunFromPlan(retrievalInput, 6);

    await seedRetrievalRunItems(
      run.id,
      Array.from({ length: 6 }, (_, index) => ({
        apollo_id: `person-${index + 1}`,
        full_name: `Person ${index + 1}`,
        title: "Head of Sales",
        company_name: `Company ${index + 1}`,
        location: "Singapore",
        seniority: "director",
      })),
      6,
    );

    await updateRetrievalRunItems(run.id, (items) =>
      items.map((item, index) =>
        index < 4
          ? {
              ...item,
              disposition: index < 3 ? "reused_verified" : "reused_unusable",
              executionStatus: "completed",
              outcomeQuality:
                index < 3 ? "verified_business_email" : "email_unavailable",
              reusedFromRunId: "prior-run",
              providerPayload: null,
              status: "completed",
              quality:
                index < 3 ? "verified_business_email" : "email_unavailable",
              email: index < 3 ? `${item.personApolloId}@example.com` : null,
              emailStatus: index < 3 ? "verified" : "unavailable",
              completedAt: new Date().toISOString(),
            }
          : item,
      ),
    );

    await updateRetrievalRun(run.id, (current) => ({
      ...current,
      status: "completed",
      processedItems: 4,
      successfulItems: 3,
      failedItems: 1,
      reusedItems: 1,
      reusedVerifiedItems: 1,
      reusedUnusableItems: 0,
      dedupedItems: 0,
      newlyEnrichedItems: 3,
      apolloRequestedItems: 3,
      pendingItems: 2,
      processingItems: 0,
      batchCount: 1,
      apiRequestCount: 1,
      completedAt: new Date().toISOString(),
    }));

    const summary = await buildRetrievalRunSummary(run.id);

    expect(summary.runStatus).toBe("completed");
    expect(summary.estimate).toEqual({
      maxContacts: 10,
      estimatedContacts: 6,
      estimateSummary: "6 contacts estimated",
      estimateNote: "fixture",
    });
    expect(summary.actual).toEqual({
      processedContacts: 4,
      attemptedContacts: 4,
      remainingContacts: 2,
      reusedContacts: 1,
      newEnrichments: 3,
      missingContacts: 1,
      creditsConsumed: 3,
    });
  });
});
