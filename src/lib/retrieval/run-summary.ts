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
  runStatus: RetrievalRunVisibleStatus;
  lastHeartbeatAt: string | null;
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
  const completed = items.filter((item) => item.status === "completed");
  const failed = items.filter((item) => item.status === "failed");
  const processing = items.filter((item) => item.status === "processing");
  const pending = items.filter((item) => item.status === "pending");
  const reusable = completed.filter((item) => item.emailStatus === "reused").length;

  return {
    runId: run.id,
    runStatus: visibleStatus,
    lastHeartbeatAt: run.lastHeartbeatAt,
    progress: {
      total: run.totalItems,
      processed: run.processedItems,
      remaining: Math.max(run.totalItems - run.processedItems, 0),
      completed: completed.length,
      failed: failed.length,
      reusable,
    },
    resumeTargets: {
      pending: pending.length,
      requeued: visibleStatus === "interrupted" ? processing.length : 0,
      unresolved: pending.length + processing.length + failed.length,
    },
  } satisfies RetrievalRunResumeSummary;
}
