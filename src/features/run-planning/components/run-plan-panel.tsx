import { saveRunPlanAction } from "@/app/recipes/actions";
import { RetrievalReadinessGate } from "@/features/run-planning/components/retrieval-readiness-gate";
import type { PeopleSnapshotRecord } from "@/lib/db/repositories/people-snapshots";
import type { RunPlanRecord } from "@/lib/db/repositories/run-plans";
import type { PeopleRecipe } from "@/lib/recipes/schema";

type RunPlanPanelProps = {
  companyRecipeId: string | null;
  peopleRecipe: PeopleRecipe | null;
  peopleSnapshot: PeopleSnapshotRecord | null;
  runPlan: RunPlanRecord | null;
};

export function RunPlanPanel({
  companyRecipeId,
  peopleRecipe,
  peopleSnapshot,
  runPlan,
}: RunPlanPanelProps) {
  if (!peopleSnapshot || !peopleRecipe || !companyRecipeId) {
    return (
      <div className="card empty-message">
        Review a people snapshot before planning verified-email retrieval.
      </div>
    );
  }

  return (
    <section className="card stack">
      <div className="workspace-header">
        <p className="eyebrow">Run planner</p>
        <h2>Estimate before retrieval</h2>
        <p>
          Create a retrieval plan from the reviewed people snapshot, define a maximum contacts cap, and explicitly confirm readiness for a later retrieval phase.
        </p>
      </div>

      <form action={saveRunPlanAction} className="stack">
        <input type="hidden" name="companyRecipeId" value={companyRecipeId} />
        <input type="hidden" name="companySnapshotId" value={peopleSnapshot.companySnapshotId} />
        <input type="hidden" name="peopleRecipeId" value={peopleRecipe.id} />
        <input type="hidden" name="peopleSnapshotId" value={peopleSnapshot.id} />

        <div className="pairing-summary">
          <div className="stat-tile">
            <span className="meta">People snapshot rows</span>
            <strong>{peopleSnapshot.result.rows.length}</strong>
          </div>
          <div className="stat-tile">
            <span className="meta">Current selection mode</span>
            <strong>{peopleSnapshot.selectionMode}</strong>
          </div>
        </div>

        <div className="field-grid">
          <div className="field">
            <label htmlFor="maxContacts">Maximum contacts</label>
            <input
              defaultValue={runPlan?.maxContacts ?? Math.min(peopleSnapshot.result.rows.length, 25)}
              id="maxContacts"
              min={1}
              name="maxContacts"
              type="number"
            />
            <span className="field-hint">
              Hard cap for how many contacts a later retrieval run is allowed to process.
            </span>
          </div>
        </div>

        <div className="workspace-actions">
          <button className="primary-button" type="submit">
            Save run plan
          </button>
        </div>
      </form>

      {runPlan ? (
        <>
          <div className="subtle-card card">
            <p className="meta">{runPlan.estimateSummary}</p>
            <p className="field-hint">{runPlan.estimateNote}</p>
          </div>
          <RetrievalReadinessGate plan={runPlan} />
        </>
      ) : null}
    </section>
  );
}
