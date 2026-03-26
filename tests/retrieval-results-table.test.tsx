import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { RetrievalRunResultsTable } from "@/features/retrieval-runs/components/retrieval-run-results-table";

describe("retrieval-results-table", () => {
  it("renders verified outcomes ahead of unusable rows using persisted internal quality values", () => {
    const markup = renderToStaticMarkup(
      <RetrievalRunResultsTable
        entries={[
          {
            id: "item-2",
            runId: "run-1",
            peopleSnapshotId: "snapshot-1",
            retrievalStatus: "completed",
            personApolloId: "person-2",
            fullName: "Taylor Ong",
            companyName: "Orbit",
            title: "RevOps Lead",
            disposition: "pending_call",
            executionStatus: "completed",
            outcomeQuality: "email_unavailable",
            reusedFromRunId: null,
            providerPayload: {
              linkedin_url: "https://linkedin.com/in/taylor-ong",
            },
            status: "completed",
            quality: "email_unavailable",
            email: null,
            emailStatus: "unavailable",
            error: null,
            attemptCount: 1,
            lastAttemptedAt: "2026-03-24T00:00:00.000Z",
            completedAt: "2026-03-24T00:00:00.000Z",
            createdAt: "2026-03-24T00:00:00.000Z",
            updatedAt: "2026-03-24T00:00:00.000Z",
          },
          {
            id: "item-1",
            runId: "run-1",
            peopleSnapshotId: "snapshot-1",
            retrievalStatus: "completed",
            personApolloId: "person-1",
            fullName: "Avery Ng",
            companyName: "Acme",
            title: "Head of Sales",
            disposition: "reused_verified",
            executionStatus: "completed",
            outcomeQuality: "verified_business_email",
            reusedFromRunId: "prior-run",
            providerPayload: {
              organization: {
                name: "Acme Corp",
              },
            },
            status: "completed",
            quality: "verified_business_email",
            email: "avery@acme.com",
            emailStatus: "reused",
            error: null,
            attemptCount: 0,
            lastAttemptedAt: null,
            completedAt: "2026-03-24T00:00:00.000Z",
            createdAt: "2026-03-24T00:00:00.000Z",
            updatedAt: "2026-03-24T00:00:00.000Z",
          },
        ]}
      />,
    );

    expect(markup.indexOf("Avery Ng")).toBeLessThan(markup.indexOf("Taylor Ong"));
    expect(markup).toContain("Verified business email");
    expect(markup).toContain("Email unavailable");
    expect(markup).toContain("email_status");
    expect(markup).toContain("organization.name");
    expect(markup).toContain("linkedin_url");
  });
});
