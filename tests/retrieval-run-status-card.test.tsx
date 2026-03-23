import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { RetrievalRunStatusCard } from "@/features/retrieval-runs/components/retrieval-run-status-card";

describe("retrieval-run-status-card", () => {
  it("renders persisted retrieval progress and checkpoint state", () => {
    const markup = renderToStaticMarkup(
      <RetrievalRunStatusCard
        run={{
          id: "run-1",
          peopleSnapshotId: "snapshot-1",
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
        }}
      />,
    );

    expect(markup).toContain("Latest persisted execution state");
    expect(markup).toContain("10 / 12");
    expect(markup).toContain("rate limited");
  });
});
