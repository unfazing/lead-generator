import type { PeoplePreviewRow } from "@/lib/apollo/people-search";
import { getEnrichedPeopleByApolloIds } from "@/lib/db/repositories/enriched-people";
import type { RetrievalRunItemRecord } from "@/lib/db/repositories/retrieval-run-items";
import { isVerifiedBusinessEmailQuality } from "@/lib/retrieval/quality";

export type RetrievalPreflightCounts = {
  pendingCallCount: number;
  reusedVerifiedCount: number;
  reusedUnusableCount: number;
  dedupedWithinRunCount: number;
};

export type PreflightSeedItem = Pick<
  RetrievalRunItemRecord,
  | "personApolloId"
  | "fullName"
  | "companyName"
  | "title"
  | "disposition"
  | "executionStatus"
  | "outcomeQuality"
  | "reusedFromRunId"
  | "providerPayload"
  | "email"
  | "emailStatus"
  | "error"
  | "attemptCount"
  | "lastAttemptedAt"
  | "completedAt"
>;

export async function buildRetrievalPreflight(
  rows: PeoplePreviewRow[],
  maxContacts: number,
) {
  const limitedRows = rows.slice(0, maxContacts);
  const cachedOutcomes = await getEnrichedPeopleByApolloIds(
    limitedRows.map((row) => row.apollo_id),
  );
  const seenApolloIds = new Set<string>();
  const completedAt = new Date().toISOString();
  const counts: RetrievalPreflightCounts = {
    pendingCallCount: 0,
    reusedVerifiedCount: 0,
    reusedUnusableCount: 0,
    dedupedWithinRunCount: 0,
  };

  const items: PreflightSeedItem[] = limitedRows.map((row) => {
    if (seenApolloIds.has(row.apollo_id)) {
      counts.dedupedWithinRunCount += 1;
      return {
        personApolloId: row.apollo_id,
        fullName: row.full_name,
        companyName: row.company_name,
        title: row.title,
        disposition: "deduped_within_run",
        executionStatus: "completed",
        outcomeQuality: null,
        reusedFromRunId: null,
        providerPayload: null,
        email: null,
        emailStatus: "deduped_within_run",
        error: null,
        attemptCount: 0,
        lastAttemptedAt: null,
        completedAt,
      };
    }

    seenApolloIds.add(row.apollo_id);
    const reused = cachedOutcomes.get(row.apollo_id);

    if (reused) {
      const verified = isVerifiedBusinessEmailQuality(reused.quality);
      if (verified) {
        counts.reusedVerifiedCount += 1;
      } else {
        counts.reusedUnusableCount += 1;
      }

      return {
        personApolloId: row.apollo_id,
        fullName: row.full_name,
        companyName: row.company_name,
        title: row.title,
        disposition: verified ? "reused_verified" : "reused_unusable",
        executionStatus: "completed",
        outcomeQuality: reused.quality,
        reusedFromRunId: reused.sourceRunId,
        providerPayload: reused.apolloPerson,
        email: reused.email,
        emailStatus: verified ? "reused" : reused.emailStatus,
        error: reused.error,
        attemptCount: 0,
        lastAttemptedAt: null,
        completedAt,
      };
    }

    counts.pendingCallCount += 1;
    return {
      personApolloId: row.apollo_id,
      fullName: row.full_name,
      companyName: row.company_name,
      title: row.title,
      disposition: "pending_call",
      executionStatus: "pending",
      outcomeQuality: null,
      reusedFromRunId: null,
      providerPayload: null,
      email: null,
      emailStatus: null,
      error: null,
      attemptCount: 0,
      lastAttemptedAt: null,
      completedAt: null,
    };
  });

  return { items, counts };
}
