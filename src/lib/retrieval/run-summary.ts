import {
  getRetrievalRunById,
  isRetrievalRunStale,
  type RetrievalRunRecord,
} from "@/lib/db/repositories/retrieval-runs";
import { listRetrievalRunItems } from "@/lib/db/repositories/retrieval-run-items";

export type RetrievalRunVisibleStatus =
  | RetrievalRunRecord["status"]
  | "interrupted";

export type RetrievalRunResumeSummary = {
  runId: string;
  run: RetrievalRunRecord;
  runStatus: RetrievalRunVisibleStatus;
  lastHeartbeatAt: string | null;
  lastCheckpointAt: string | null;
  progress: {
    total: number;
    processed: number;
    remaining: number;
    completed: number;
    failed: number;
    reusable: number;
  };
  resumeTargets: {
    pending: number;
    requeued: number;
    unresolved: number;
  };
  preflight: {
    pendingCallCount: number;
    reusedVerifiedCount: number;
    reusedUnusableCount: number;
    dedupedWithinRunCount: number;
  };
};

export type RetrievalRunSummary = RetrievalRunResumeSummary & {
  run: RetrievalRunRecord;
  estimate: {
    maxContacts: number;
    estimatedContacts: number;
    estimateSummary: string;
    estimateNote: string;
  };
  actual: {
    processedContacts: number;
    attemptedContacts: number;
    remainingContacts: number;
    reusedContacts: number;
    newEnrichments: number;
    missingContacts: number;
    creditsConsumed: number | null;
  };
};

export function deriveRetrievalRunStatus(
  run: RetrievalRunRecord,
  now = Date.now(),
) {
  if (isRetrievalRunStale(run, now)) {
    return "interrupted" as const;
  }

  return run.status;
}

export async function buildRetrievalRunResumeSummary(runId: string) {
  const [run, items] = await Promise.all([
    getRetrievalRunById(runId),
    listRetrievalRunItems(runId),
  ]);

  if (!run) {
    throw new Error("Retrieval run not found");
  }

  const visibleStatus = deriveRetrievalRunStatus(run);
  const completed = items.filter((item) => item.executionStatus === "completed");
  const failed = items.filter((item) => item.executionStatus === "failed");
  const processing = items.filter((item) => item.executionStatus === "processing");
  const pending = items.filter((item) => item.executionStatus === "pending");
  const reusable = completed.filter((item) => item.emailStatus === "reused").length;

  return {
    runId: run.id,
    run,
    runStatus: visibleStatus,
    lastHeartbeatAt: run.lastHeartbeatAt,
    lastCheckpointAt: run.lastCheckpointAt,
    progress: {
      total: run.totalItems,
      processed: run.processedItems,
      remaining: Math.max(run.totalItems - run.processedItems, 0),
      completed: completed.length,
      failed: failed.length,
      reusable: run.reusedItems || reusable,
    },
    resumeTargets: {
      pending: pending.length,
      requeued: visibleStatus === "interrupted" ? processing.length : 0,
      unresolved: pending.length + processing.length + failed.length,
    },
    preflight: {
      pendingCallCount: items.filter((item) => item.disposition === "pending_call").length,
      reusedVerifiedCount: items.filter((item) => item.disposition === "reused_verified").length,
      reusedUnusableCount: items.filter((item) => item.disposition === "reused_unusable").length,
      dedupedWithinRunCount: items.filter(
        (item) => item.disposition === "deduped_within_run",
      ).length,
    },
  } satisfies RetrievalRunResumeSummary;
}

export async function buildRetrievalRunSummary(
  runId: string,
): Promise<RetrievalRunSummary> {
  const resume = await buildRetrievalRunResumeSummary(runId);

  return {
    ...resume,
    run: resume.run,
    estimate: {
      maxContacts: resume.run.maxContacts,
      estimatedContacts: resume.run.estimatedContacts,
      estimateSummary: resume.run.estimateSummary,
      estimateNote: resume.run.estimateNote,
    },
    actual: {
      processedContacts: resume.run.processedItems,
      attemptedContacts:
        resume.run.apolloRequestedItems +
        resume.run.reusedItems +
        resume.run.dedupedItems,
      remainingContacts: resume.progress.remaining,
      reusedContacts: resume.run.reusedItems,
      newEnrichments: resume.run.newlyEnrichedItems,
      missingContacts: resume.run.failedItems,
      creditsConsumed: resume.run.apolloRequestedItems,
    },
  };
}
