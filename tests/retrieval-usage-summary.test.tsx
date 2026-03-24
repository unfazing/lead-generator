import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { GET } from "@/app/api/retrieval-runs/[runId]/route";
import { RetrievalRunUsageSummary } from "@/features/retrieval-runs/components/retrieval-run-usage-summary";
import { savePeopleSnapshot } from "@/lib/db/repositories/people-snapshots";
import { updateRetrievalRunItems } from "@/lib/db/repositories/retrieval-run-items";
import { updateRetrievalRun } from "@/lib/db/repositories/retrieval-runs";
import { buildRetrievalRunSummary } from "@/lib/retrieval/run-summary";
import { kickoffRetrievalRun } from "@/lib/retrieval/execution";

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
      signature: `usage-sig-${personCount}`,
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

describe("retrieval-usage-summary", () => {
  beforeEach(async () => {
    await backupManagedFiles();
  });

  afterEach(async () => {
    await restoreManagedFiles();
  });

  it("reports immutable estimate fields alongside persisted actual usage counts", async () => {
    const input = await buildRetrievalInput(6);
    const run = await kickoffRetrievalRun({ ...input, autoExecute: false });

    await updateRetrievalRun(run.id, (current) => ({
      ...current,
      status: "completed",
      processedItems: 5,
      successfulItems: 3,
      failedItems: 2,
      reusedItems: 2,
      reusedVerifiedItems: 2,
      reusedUnusableItems: 0,
      dedupedItems: 0,
      newlyEnrichedItems: 3,
      apolloRequestedItems: 3,
      pendingItems: 1,
      processingItems: 0,
      completedAt: new Date().toISOString(),
    }));

    const summary = await buildRetrievalRunSummary(run.id);

    expect(summary.estimate).toMatchObject({
      estimatedContacts: 6,
      estimateSummary: "6 contacts estimated",
    });
    expect(summary.actual).toEqual({
      processedContacts: 5,
      attemptedContacts: 5,
      remainingContacts: 1,
      reusedContacts: 2,
      newEnrichments: 3,
      missingContacts: 2,
      creditsConsumed: 3,
    });
  });

  it("returns server-backed status and reconciliation fields from the polling route", async () => {
    const input = await buildRetrievalInput(4);
    const run = await kickoffRetrievalRun({ ...input, autoExecute: false });
    const staleIso = new Date(Date.now() - 10 * 60 * 1000).toISOString();

    await updateRetrievalRun(run.id, (current) => ({
      ...current,
      status: "active",
      processedItems: 2,
      successfulItems: 1,
      failedItems: 1,
      reusedItems: 1,
      reusedVerifiedItems: 1,
      reusedUnusableItems: 0,
      dedupedItems: 0,
      newlyEnrichedItems: 1,
      apolloRequestedItems: 1,
      pendingItems: 1,
      processingItems: 1,
      lastHeartbeatAt: staleIso,
      lastCheckpointAt: staleIso,
    }));
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
            completedAt: new Date().toISOString(),
          };
        }

        if (index === 2) {
          return {
            ...item,
            executionStatus: "pending",
            status: "pending",
          };
        }

        return {
          ...item,
          executionStatus: "processing",
          status: "processing",
          error: "interrupted in flight",
        };
      }),
    );

    const response = await GET(new Request(`http://localhost/api/retrieval-runs/${run.id}`), {
      params: Promise.resolve({ runId: run.id }),
    });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.runStatus).toBe("interrupted");
    expect(payload.actual.attemptedContacts).toBe(2);
    expect(payload.resumeTargets).toEqual({
      pending: 1,
      requeued: 1,
      unresolved: 2,
    });
  });

  it("renders a practical estimate-versus-actual summary for completed runs", async () => {
    const input = await buildRetrievalInput(8);
    const run = await kickoffRetrievalRun({ ...input, autoExecute: false });

    await updateRetrievalRun(run.id, (current) => ({
      ...current,
      status: "completed",
      processedItems: 8,
      successfulItems: 6,
      failedItems: 2,
      reusedItems: 3,
      reusedVerifiedItems: 3,
      reusedUnusableItems: 0,
      dedupedItems: 0,
      newlyEnrichedItems: 5,
      apolloRequestedItems: 5,
      pendingItems: 0,
      processingItems: 0,
      completedAt: new Date().toISOString(),
    }));

    const summary = await buildRetrievalRunSummary(run.id);
    const markup = renderToStaticMarkup(
      <RetrievalRunUsageSummary summary={summary} />,
    );

    expect(markup).toContain("Estimate vs actual");
    expect(markup).toContain("8");
    expect(markup).toContain("Apollo credits consumed");
    expect(markup).toContain("5");
  });
});
