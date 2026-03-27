import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { RetrievalRunStatusCard } from "@/features/retrieval-runs/components/retrieval-run-status-card";

describe("retrieval-run-status-card", () => {
  it("renders persisted retrieval progress and checkpoint state", () => {
    const markup = renderToStaticMarkup(
      <RetrievalRunStatusCard
        initialSummary={{
          runId: "run-1",
          runStatus: "cooldown",
          lastHeartbeatAt: "2026-03-24T00:00:00.000Z",
          lastCheckpointAt: "2026-03-24T00:00:00.000Z",
          progress: {
            total: 12,
            processed: 10,
            remaining: 2,
            completed: 10,
            failed: 2,
            reusable: 0,
          },
          resumeTargets: {
            pending: 2,
            requeued: 0,
            unresolved: 2,
          },
          preflight: {
            pendingCallCount: 6,
            reusedVerifiedCount: 3,
            reusedUnusableCount: 1,
            dedupedWithinRunCount: 2,
          },
          estimate: {
            maxContacts: 12,
            estimatedContacts: 12,
            estimateSummary: "12 contacts estimated",
            estimateNote: "fixture",
          },
          actual: {
            processedContacts: 10,
            attemptedContacts: 10,
            remainingContacts: 2,
            reusedContacts: 4,
            newEnrichments: 6,
            missingContacts: 2,
            creditsConsumed: 6,
          },
          run: {
            id: "run-1",
            peopleSnapshotId: "snapshot-1",
            contactBatchId: null,
            companyRecipeId: "company-recipe-1",
            peopleRecipeId: "people-recipe-1",
            companySnapshotId: "company-snapshot-1",
            maxContacts: 12,
            estimatedContacts: 12,
            estimateSummary: "12 contacts estimated",
            estimateNote: "fixture",
            status: "cooldown",
            totalItems: 12,
            processedItems: 10,
            successfulItems: 8,
            failedItems: 2,
            reusedItems: 4,
            dedupedItems: 2,
            reusedVerifiedItems: 3,
            reusedUnusableItems: 1,
            newlyEnrichedItems: 6,
            apolloRequestedItems: 6,
            pendingItems: 2,
            processingItems: 0,
            currentBatchSize: 0,
            batchCount: 1,
            apiRequestCount: 1,
            retryCount: 1,
            cooldownUntil: "2026-03-24T00:00:00.000Z",
            retryAfter: "2026-03-24T00:00:00.000Z",
            lastError: "rate limited",
            lastCheckpointAt: "2026-03-24T00:00:00.000Z",
            lastHeartbeatAt: "2026-03-24T00:00:00.000Z",
            lastBatchStartedAt: "2026-03-24T00:00:00.000Z",
            lastBatchCompletedAt: "2026-03-24T00:00:00.000Z",
            startedAt: "2026-03-24T00:00:00.000Z",
            completedAt: null,
            lease: null,
            createdAt: "2026-03-24T00:00:00.000Z",
            updatedAt: "2026-03-24T00:00:00.000Z",
          },
        }}
      />,
    );

    expect(markup).toContain("Latest persisted execution state");
    expect(markup).toContain("10 / 12");
    expect(markup).toContain("rate limited");
  });
});
