import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  listRetrievalRunItems,
  updateRetrievalRunItems,
} from "@/lib/db/repositories/retrieval-run-items";
import {
  getRetrievalRunById,
  updateRetrievalRun,
} from "@/lib/db/repositories/retrieval-runs";
import {
  executeRetrievalRun,
  getRetrievalRunResumeSummary,
  kickoffRetrievalRun,
} from "@/lib/retrieval/execution";
import { savePeopleSnapshot } from "@/lib/db/repositories/people-snapshots";

const dataDir = path.join(process.cwd(), "data");
const managedFiles = [
  "people-snapshots.json",
  "retrieval-runs.json",
  "retrieval-run-items.json",
  "enriched-people.json",
] as const;
const backupSuffix = ".bak.test";

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

async function buildRetrievalInput(personCount: number) {
  const peopleSnapshot = await savePeopleSnapshot(
    {
      companyRecipeId: "company-recipe-1",
      companySnapshotId: "company-snapshot-1",
      peopleRecipeId: "people-recipe-1",
      recipeParams: {
        page: 1,
        perPage: personCount,
        personTitles: [],
        includeSimilarTitles: false,
        qKeywords: "",
        personLocations: [],
        personSeniorities: [],
        organizationLocations: [],
        qOrganizationDomainsList: [],
        contactEmailStatus: [],
        organizationIds: [],
        organizationNumEmployeesRanges: [],
        revenueRangeMin: undefined,
        revenueRangeMax: undefined,
        currentlyUsingAllOfTechnologyUids: [],
        currentlyUsingAnyOfTechnologyUids: [],
        currentlyNotUsingAnyOfTechnologyUids: [],
        qOrganizationJobTitles: [],
        organizationJobLocations: [],
        organizationNumJobsRangeMin: undefined,
        organizationNumJobsRangeMax: undefined,
        organizationJobPostedAtRangeMin: undefined,
        organizationJobPostedAtRangeMax: undefined,
      },
      selectionMode: "all",
      selectedCompanyIds: [],
      organizationImports: [],
    },
    {
      signature: `resume-sig-${personCount}`,
      fetchedAt: new Date().toISOString(),
      request: {
        companyRecipeId: "company-recipe-1",
        companySnapshotId: "company-snapshot-1",
        peopleRecipeId: "people-recipe-1",
        mode: "all",
        selectedCompanyIds: [],
        page: 1,
        perPage: personCount,
        personTitles: [],
        includeSimilarTitles: false,
        qKeywords: "",
        personLocations: [],
        personSeniorities: [],
        organizationLocations: [],
        qOrganizationDomainsList: [],
        contactEmailStatus: [],
        organizationIds: [],
        organizationNumEmployeesRanges: [],
        revenueRangeMin: undefined,
        revenueRangeMax: undefined,
        currentlyUsingAllOfTechnologyUids: [],
        currentlyUsingAnyOfTechnologyUids: [],
        currentlyNotUsingAnyOfTechnologyUids: [],
        qOrganizationJobTitles: [],
        organizationJobLocations: [],
        organizationNumJobsRangeMin: undefined,
        organizationNumJobsRangeMax: undefined,
        organizationJobPostedAtRangeMin: undefined,
        organizationJobPostedAtRangeMax: undefined,
      },
      rows: Array.from({ length: personCount }, (_, index) => ({
        apollo_id: `person-${index + 1}`,
        full_name: `Person ${index + 1}`,
        title: "Head of Sales",
        company_name: `Company ${index + 1}`,
        location: "Singapore",
        seniority: "director",
      })),
      page: 1,
      perPage: personCount,
      totalDisplayCount: personCount,
      hasMore: false,
      availableColumns: ["apollo_id", "full_name"],
      source: "fixture",
    },
  );

  return {
    companyRecipeId: "company-recipe-1",
    peopleRecipeId: "people-recipe-1",
    companySnapshotId: "company-snapshot-1",
    peopleSnapshotId: peopleSnapshot.id,
    maxContacts: personCount,
    estimatedContacts: personCount,
    estimateSummary: `${personCount} contacts estimated`,
    estimateNote: "fixture",
  };
}

describe("retrieval resume", () => {
  beforeEach(async () => {
    await backupManagedFiles();
  });

  afterEach(async () => {
    await restoreManagedFiles();
  });

  it("surfaces a stale heartbeat on a persisted running run as interrupted during inspection", async () => {
    const input = await buildRetrievalInput(3);
    const run = await kickoffRetrievalRun({ ...input, autoExecute: false });
    const staleIso = new Date(Date.now() - 10 * 60 * 1000).toISOString();

    await updateRetrievalRun(run.id, (current) => ({
      ...current,
      status: "active",
      processedItems: 1,
      pendingItems: 2,
      processingItems: 1,
      lastHeartbeatAt: staleIso,
      lastCheckpointAt: staleIso,
    }));

    const summary = await getRetrievalRunResumeSummary(run.id);

    expect(summary.runStatus).toBe("interrupted");
    expect(summary.progress.processed).toBe(1);
    expect(summary.progress.remaining).toBe(2);
    expect(summary.lastHeartbeatAt).toBe(staleIso);
  });

  it("resume only re-queues unresolved run items and leaves completed items untouched", async () => {
    const input = await buildRetrievalInput(4);
    const run = await kickoffRetrievalRun({ ...input, autoExecute: false });
    const attemptedTargets: string[][] = [];
    const itemIds = (await listRetrievalRunItems(run.id)).map((item) => item.id);

    await updateRetrievalRunItems(run.id, (items) =>
      items.map((item, index) => {
        if (index === 0) {
          return {
            ...item,
            disposition: "pending_call",
            executionStatus: "completed",
            outcomeQuality: "verified_business_email",
            reusedFromRunId: null,
            providerPayload: null,
            status: "completed",
            quality: "verified_business_email",
            email: "person-1@example.com",
            emailStatus: "verified",
            completedAt: new Date().toISOString(),
          };
        }

        if (index === 1) {
          return {
            ...item,
            disposition: "pending_call",
            executionStatus: "completed",
            outcomeQuality: "email_unavailable",
            reusedFromRunId: null,
            providerPayload: null,
            status: "completed",
            quality: "email_unavailable",
            email: null,
            emailStatus: "unavailable",
            error: "no verified email",
            completedAt: new Date().toISOString(),
          };
        }

        if (index === 2) {
          return {
            ...item,
            executionStatus: "failed",
            status: "failed",
            error: "temporary Apollo error",
          };
        }

        return {
          ...item,
          executionStatus: "processing",
          status: "processing",
          error: "batch interrupted",
        };
      }),
    );
    await updateRetrievalRun(run.id, (current) => ({
      ...current,
      status: "active",
      processedItems: 2,
      successfulItems: 1,
      failedItems: 1,
      pendingItems: 0,
      processingItems: 2,
      lastHeartbeatAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      lastCheckpointAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    }));

    await executeRetrievalRun(run.id, {
      enrichBatch: async (targets) => {
        attemptedTargets.push(targets.map((target) => target.personApolloId));
        return {
          type: "completed",
          mode: "bulk_match",
          outcomes: targets.map((target) => ({
            personApolloId: target.personApolloId,
            email: `${target.personApolloId}@example.com`,
            emailStatus: "verified",
            quality: "verified_business_email",
            error: null,
            apolloPerson: {
              id: target.personApolloId,
              name: target.fullName,
              title: target.title,
              organization_name: target.companyName,
              email: `${target.personApolloId}@example.com`,
              email_status: "verified",
            },
          })),
        };
      },
      wait: async () => {},
    });

    const items = await listRetrievalRunItems(run.id);

    expect(attemptedTargets).toEqual([["person-3", "person-4"]]);
    expect(items.find((item) => item.id === itemIds[0])?.email).toBe(
      "person-1@example.com",
    );
    expect(items.find((item) => item.id === itemIds[1])?.emailStatus).toBe(
      "unavailable",
    );
    expect(items.every((item) => item.executionStatus === "completed")).toBe(true);
  });

  it("exposes prior progress and remaining work before continuing a persisted run", async () => {
    const input = await buildRetrievalInput(5);
    const run = await kickoffRetrievalRun({ ...input, autoExecute: false });
    const staleIso = new Date(Date.now() - 10 * 60 * 1000).toISOString();

    await updateRetrievalRunItems(run.id, (items) =>
      items.map((item, index) =>
        index < 2
          ? {
              ...item,
              disposition: "pending_call",
              executionStatus: "completed",
              outcomeQuality: "verified_business_email",
              reusedFromRunId: null,
              providerPayload: null,
              status: "completed",
              quality: "verified_business_email",
              email: `${item.personApolloId}@example.com`,
              emailStatus: "verified",
              completedAt: new Date().toISOString(),
            }
          : item,
      ),
    );
    await updateRetrievalRun(run.id, (current) => ({
      ...current,
      status: "active",
      processedItems: 2,
      successfulItems: 2,
      failedItems: 0,
      pendingItems: 3,
      processingItems: 0,
      lastHeartbeatAt: staleIso,
      lastCheckpointAt: staleIso,
    }));

    const summary = await getRetrievalRunResumeSummary(run.id);
    const persisted = await getRetrievalRunById(run.id);

    expect(summary.runId).toBe(run.id);
    expect(summary.runStatus).toBe("interrupted");
    expect(summary.progress).toEqual({
      total: 5,
      processed: 2,
      remaining: 3,
      completed: 2,
      failed: 0,
      reusable: 0,
    });
    expect(summary.resumeTargets).toEqual({
      pending: 3,
      requeued: 0,
      unresolved: 3,
    });
    expect(persisted?.status).toBe("active");
  });
});
