import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { executeRetrievalRun, kickoffRetrievalRun } from "@/lib/retrieval/execution";
import { listEnrichedPeople } from "@/lib/db/repositories/enriched-people";
import { listRetrievalRunItems } from "@/lib/db/repositories/retrieval-run-items";
import { getRetrievalRunById } from "@/lib/db/repositories/retrieval-runs";
import { savePeopleSnapshot } from "@/lib/db/repositories/people-snapshots";

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
      signature: `sig-${personCount}`,
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

describe("people enrichment execution", () => {
  beforeEach(async () => {
    await backupManagedFiles();
  });

  afterEach(async () => {
    await restoreManagedFiles();
  });

  it("kickoff from a confirmed plan creates a retrieval run and uses bulk_match for batches up to ten", async () => {
    const input = await buildRetrievalInput(3);
    const run = await kickoffRetrievalRun({ ...input, autoExecute: false });
    const modes: string[] = [];

    await executeRetrievalRun(run.id, {
      enrichBatch: async (targets) => {
        modes.push(targets.length === 1 ? "match" : "bulk_match");
        return {
          type: "completed",
          mode: targets.length === 1 ? "match" : "bulk_match",
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

    const persisted = await getRetrievalRunById(run.id);
    expect(modes).toEqual(["bulk_match"]);
    expect(persisted?.processedItems).toBe(3);
  });

  it("uses match for a single-item remainder batch", async () => {
    const input = await buildRetrievalInput(11);
    const run = await kickoffRetrievalRun({ ...input, autoExecute: false });
    const modes: string[] = [];

    await executeRetrievalRun(run.id, {
      enrichBatch: async (targets) => {
        modes.push(targets.length === 1 ? "match" : "bulk_match");
        return {
          type: "completed",
          mode: targets.length === 1 ? "match" : "bulk_match",
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

    expect(modes).toEqual(["bulk_match", "match"]);
  });

  it("can kickoff enrichment for only the selected Apollo ids", async () => {
    const input = await buildRetrievalInput(5);
    const run = await kickoffRetrievalRun({
      ...input,
      autoExecute: false,
      selectedApolloIds: ["person-2", "person-4"],
    });

    const items = await listRetrievalRunItems(run.id);

    expect(items.map((item) => item.personApolloId)).toEqual(["person-2", "person-4"]);
  });

  it("persists each completed batch before the next batch starts", async () => {
    const input = await buildRetrievalInput(12);
    const run = await kickoffRetrievalRun({ ...input, autoExecute: false });
    const checkpoints: number[] = [];

    await executeRetrievalRun(run.id, {
      enrichBatch: async (targets) => ({
        type: "completed",
        mode: targets.length === 1 ? "match" : "bulk_match",
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
      }),
      wait: async () => {
        const persisted = await getRetrievalRunById(run.id);
        checkpoints.push(persisted?.processedItems ?? 0);
      },
    });

    expect(checkpoints[0]).toBe(10);
  });

  it("persists retry backoff when Apollo rate limits a batch", async () => {
    const input = await buildRetrievalInput(2);
    const run = await kickoffRetrievalRun({ ...input, autoExecute: false });
    let attempts = 0;

    await executeRetrievalRun(run.id, {
      enrichBatch: async (targets) => {
        attempts += 1;
        if (attempts === 1) {
          return {
            type: "rate_limited",
            mode: "bulk_match",
            retryAfterMs: 5,
            message: "rate limited",
          };
        }

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

    const persisted = await getRetrievalRunById(run.id);
    const items = await listRetrievalRunItems(run.id);

    expect(persisted?.retryCount).toBe(1);
    expect(persisted?.completedAt).toBeTruthy();
    expect(items.every((item) => item.status === "completed")).toBe(true);
  });

  it("reuses people already present in the central enriched-people store and skips re-enrichment", async () => {
    const input = await buildRetrievalInput(2);
    const firstRun = await kickoffRetrievalRun({ ...input, autoExecute: false });
    let firstExecutionCalls = 0;

    await executeRetrievalRun(firstRun.id, {
      enrichBatch: async (targets) => {
        firstExecutionCalls += 1;
        return {
          type: "completed",
          mode: targets.length === 1 ? "match" : "bulk_match",
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

    expect(firstExecutionCalls).toBe(1);
    expect((await listEnrichedPeople()).map((entry) => entry.personApolloId)).toEqual([
      "person-1",
      "person-2",
    ]);
    expect((await listEnrichedPeople())[0]?.apolloPerson).toMatchObject({
      id: "person-1",
      email: "person-1@example.com",
    });

    const secondRun = await kickoffRetrievalRun({ ...input, autoExecute: false });
    let secondExecutionCalls = 0;

    await executeRetrievalRun(secondRun.id, {
      enrichBatch: async () => {
        secondExecutionCalls += 1;
        return {
          type: "completed",
          mode: "bulk_match",
          outcomes: [],
        };
      },
      wait: async () => {},
    });

    const secondRunItems = await listRetrievalRunItems(secondRun.id);
    const persistedSecondRun = await getRetrievalRunById(secondRun.id);

    expect(secondExecutionCalls).toBe(0);
    expect(secondRunItems.every((item) => item.status === "completed")).toBe(true);
    expect(persistedSecondRun?.processedItems).toBe(2);
    expect(persistedSecondRun?.reusedItems).toBe(2);
    expect(persistedSecondRun?.apolloRequestedItems).toBe(0);
    expect(persistedSecondRun?.newlyEnrichedItems).toBe(0);
  });
});
