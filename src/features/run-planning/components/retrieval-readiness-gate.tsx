import { confirmRunPlanAction } from "@/app/recipes/actions";
import type { RunPlanRecord } from "@/lib/db/repositories/run-plans";

type RetrievalReadinessGateProps = {
  plan: RunPlanRecord;
};

export function RetrievalReadinessGate({
  plan,
}: RetrievalReadinessGateProps) {
  if (plan.status === "ready") {
    return (
      <div className="subtle-card card stack">
        <p className="meta">
          Retrieval readiness confirmed {plan.confirmedAt ? formatStableDateTime(plan.confirmedAt) : ""}.
        </p>
        <p className="field-hint">
          This plan is approved for later retrieval execution in Phase 4. No retrieval starts from this screen.
        </p>
      </div>
    );
  }

  return (
    <form action={confirmRunPlanAction} className="stack">
      <input type="hidden" name="runPlanId" value={plan.id} />
      <div className="subtle-card card stack">
        <p className="meta">
          Review the estimate and stop conditions, then explicitly mark this plan ready for later retrieval.
        </p>
      </div>
      <div className="workspace-actions">
        <button className="primary-button" type="submit">
          Confirm plan and mark ready
        </button>
      </div>
    </form>
  );
}

function formatStableDateTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(new Date(value));
}
