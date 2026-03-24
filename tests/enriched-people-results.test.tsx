import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { EnrichedPeopleResults } from "@/features/retrieval-runs/components/enriched-people-results";

describe("enriched-people-results", () => {
  it("renders persisted enriched entries", () => {
    const markup = renderToStaticMarkup(
      <EnrichedPeopleResults
        entries={[
          {
            id: "item-1",
            runId: "run-1",
            peopleSnapshotId: "snapshot-1",
            retrievalStatus: "completed",
            personApolloId: "person-1",
            fullName: "Avery Ng",
            companyName: "Acme",
            title: "Head of Sales",
            disposition: "pending_call",
            executionStatus: "completed",
            outcomeQuality: "verified_business_email",
            reusedFromRunId: null,
            providerPayload: null,
            status: "completed",
            quality: "verified_business_email",
            email: "avery@acme.com",
            emailStatus: "verified",
            error: null,
            attemptCount: 1,
            lastAttemptedAt: "2026-03-24T00:00:00.000Z",
            completedAt: "2026-03-24T00:00:00.000Z",
            createdAt: "2026-03-24T00:00:00.000Z",
            updatedAt: "2026-03-24T00:00:00.000Z",
          },
        ]}
      />,
    );

    expect(markup).toContain("Stored enrichment outcomes for this snapshot");
    expect(markup).toContain("avery@acme.com");
    expect(markup).toContain("Avery Ng");
  });
});
