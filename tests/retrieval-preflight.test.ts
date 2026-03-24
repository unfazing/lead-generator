import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { kickoffRetrievalRun } from "@/lib/retrieval/execution";
import { savePeopleSnapshot } from "@/lib/db/repositories/people-snapshots";
import { listRetrievalRunItems } from "@/lib/db/repositories/retrieval-run-items";
import { getRetrievalRunById } from "@/lib/db/repositories/retrieval-runs";
import { upsertEnrichedPeople } from "@/lib/db/repositories/enriched-people";
import { buildRetrievalRunSummary } from "@/lib/retrieval/run-summary";

const dataDir = path.join(process.cwd(), "data");
const managedFiles = [
  "enriched-people.json",
  "people-snapshots.json",
  "retrieval-runs.json",
  "retrieval-run-items.json",
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

async function buildRetrievalInput(apolloIds: string[]) {
  const peopleSnapshot = await savePeopleSnapshot(
    {
      companyRecipeId: "company-recipe-1",
      companySnapshotId: "company-snapshot-1",
      peopleRecipeId: "people-recipe-1",
      recipeParams: {
        page: 1,
        perPage: apolloIds.length,
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
      signature: `sig-${apolloIds.join("-")}`,
      fetchedAt: new Date().toISOString(),
      request: {
        companyRecipeId: "company-recipe-1",
        companySnapshotId: "company-snapshot-1",
        peopleRecipeId: "people-recipe-1",
        mode: "all",
        selectedCompanyIds: [],
        page: 1,
        perPage: apolloIds.length,
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
      rows: apolloIds.map((apolloId, index) => ({
        apollo_id: apolloId,
        full_name: `Person ${index + 1}`,
        title: "Head of Sales",
        company_name: `Company ${index + 1}`,
        location: "Singapore",
        seniority: "director",
      })),
      page: 1,
      perPage: apolloIds.length,
      totalDisplayCount: apolloIds.length,
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
    maxContacts: apolloIds.length,
    estimatedContacts: apolloIds.length,
    estimateSummary: `${apolloIds.length} contacts estimated`,
    estimateNote: "fixture",
  };
}

describe("retrieval preflight", () => {
  beforeEach(async () => {
    await backupManagedFiles();
  });

  afterEach(async () => {
    await restoreManagedFiles();
  });

  it("marks duplicate contacts in the same run as deduped_within_run and leaves only unique pending Apollo calls", async () => {
    const input = await buildRetrievalInput(["person-1", "person-1", "person-2"]);

    const run = await kickoffRetrievalRun({ ...input, autoExecute: false });
    const items = await listRetrievalRunItems(run.id);

    expect(items.map((item) => item.disposition)).toEqual([
      "pending_call",
      "deduped_within_run",
      "pending_call",
    ]);
    expect(items.filter((item) => item.disposition === "pending_call")).toHaveLength(2);
    expect(items.find((item) => item.disposition === "deduped_within_run")?.executionStatus).toBe(
      "completed",
    );
  });

  it("reuses prior verified and unusable terminal outcomes before execution begins", async () => {
    await upsertEnrichedPeople("prior-run", [
      {
        personApolloId: "person-1",
        email: "person-1@example.com",
        emailStatus: "verified",
        quality: "verified_business_email",
        error: null,
        apolloPerson: { id: "person-1" },
      },
      {
        personApolloId: "person-2",
        email: null,
        emailStatus: "unavailable",
        quality: "no_match",
        error: "Apollo returned no matching person",
        apolloPerson: null,
      },
    ]);
    const input = await buildRetrievalInput(["person-1", "person-2", "person-3"]);

    const run = await kickoffRetrievalRun({ ...input, autoExecute: false });
    const items = await listRetrievalRunItems(run.id);

    expect(items.map((item) => item.disposition)).toEqual([
      "reused_verified",
      "reused_unusable",
      "pending_call",
    ]);
    expect(items[0]?.reusedFromRunId).toBe("prior-run");
    expect(items[1]?.outcomeQuality).toBe("no_match");
    expect(items[2]?.executionStatus).toBe("pending");
  });

  it("persists pending-call, reused, and deduped counts on the run summary before processing starts", async () => {
    await upsertEnrichedPeople("prior-run", [
      {
        personApolloId: "person-1",
        email: "person-1@example.com",
        emailStatus: "verified",
        quality: "verified_business_email",
        error: null,
        apolloPerson: { id: "person-1" },
      },
    ]);
    const input = await buildRetrievalInput([
      "person-1",
      "person-2",
      "person-2",
      "person-3",
    ]);

    const run = await kickoffRetrievalRun({ ...input, autoExecute: false });
    const persistedRun = await getRetrievalRunById(run.id);
    const summary = await buildRetrievalRunSummary(run.id);

    expect(persistedRun?.pendingItems).toBe(2);
    expect(persistedRun?.reusedItems).toBe(1);
    expect(persistedRun?.dedupedItems).toBe(1);
    expect(summary.preflight).toEqual({
      pendingCallCount: 2,
      reusedVerifiedCount: 1,
      reusedUnusableCount: 0,
      dedupedWithinRunCount: 1,
    });
    expect(summary.actual.attemptedContacts).toBe(2);
  });
});
