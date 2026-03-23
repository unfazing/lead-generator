import type { PeopleSnapshotRecord } from "@/lib/db/repositories/people-snapshots";

export type RunPlanEstimate = {
  estimatedContacts: number;
  estimateSummary: string;
  estimateNote: string;
};

export function buildRunPlanEstimate(
  snapshot: PeopleSnapshotRecord,
  maxContacts: number,
): RunPlanEstimate {
  const estimatedContacts = Math.min(snapshot.result.rows.length, maxContacts);

  return {
    estimatedContacts,
    estimateSummary: `${estimatedContacts} contact(s) would be eligible for retrieval under the current cap.`,
    estimateNote:
      "This is a conservative pre-retrieval planning estimate based on the reviewed people snapshot. Actual retrieval usage is validated later in Phase 4.",
  };
}
