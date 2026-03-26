import Link from "next/link";
import type { ContactBatchRecord } from "@/lib/db/repositories/contact-batches";

type BatchSummary = {
  batch: ContactBatchRecord;
  totalMembers: number;
  alreadyEnrichedMembers: number;
  lastAddedFromSnapshot: string | null;
};

type ContactBatchListProps = {
  activeBatchId: string | null;
  batches: BatchSummary[];
  createAction: (formData: FormData) => Promise<void>;
  updateAction: (formData: FormData) => Promise<void>;
  deleteAction: (formData: FormData) => Promise<void>;
};

export function ContactBatchList({
  activeBatchId,
  batches,
  createAction,
  updateAction,
  deleteAction,
}: ContactBatchListProps) {
  return (
    <section className="card recipe-rail">
      <div className="recipe-rail-header">
        <div className="workspace-header">
          <p className="eyebrow">Contact batches</p>
          <h2>Saved enrichment worksets</h2>
          <p>Pick a batch, then manage members and enrichment from the main pane.</p>
        </div>
        <span className="badge">{batches.length} saved</span>
      </div>
      <details className="filter-details">
        <summary className="filter-details-summary">
          <span>New contact batch</span>
        </summary>
        <form action={createAction} className="field-grid filter-details-body">
          <label className="field">
            <span>Name</span>
            <input name="name" placeholder="Q2 design agency prospects" required />
          </label>
          <label className="field">
            <span>Notes</span>
            <textarea
              name="notes"
              placeholder="Optional operator notes"
              rows={3}
            />
          </label>
          <div className="workspace-actions">
            <button className="primary-button" type="submit">
              Create batch
            </button>
          </div>
        </form>
      </details>
      <div className="recipe-list">
        {batches.length === 0 ? (
          <div className="empty-message recipe-empty-state">
            No contact batches yet. Create one here, then populate it from saved
            people snapshots in the enrichment workflow.
          </div>
        ) : null}
        {batches.map((summary) => {
          const isActive = summary.batch.id === activeBatchId;

          return (
            <article
              key={summary.batch.id}
              className={`recipe-list-item${isActive ? " active" : ""}`}
            >
              <Link
                className="recipe-list-link"
                href={`/enrich?batch=${summary.batch.id}`}
              >
                <strong>{summary.batch.name}</strong>
                <span className="meta">{summary.batch.notes || "No notes yet."}</span>
                <span className="meta">
                  {summary.totalMembers} members • {summary.alreadyEnrichedMembers} already
                  covered
                </span>
                <span className="meta">
                  Latest snapshot {summary.lastAddedFromSnapshot?.slice(0, 8) ?? "none"}
                </span>
              </Link>
              <div className="recipe-list-actions">
                <details className="filter-details">
                  <summary className="secondary-button recipe-edit-button">✎</summary>
                  <form action={updateAction} className="field-grid filter-details-body">
                    <input name="batchId" type="hidden" value={summary.batch.id} />
                    <label className="field">
                      <span>Name</span>
                      <input
                        defaultValue={summary.batch.name}
                        name="name"
                        required
                      />
                    </label>
                    <label className="field">
                      <span>Notes</span>
                      <textarea
                        defaultValue={summary.batch.notes}
                        name="notes"
                        rows={3}
                      />
                    </label>
                    <button className="primary-button" type="submit">
                      Save
                    </button>
                  </form>
                </details>
                <form action={deleteAction}>
                  <input name="batchId" type="hidden" value={summary.batch.id} />
                  <button
                    aria-label={`Delete ${summary.batch.name}`}
                    className="secondary-button recipe-delete-button"
                    type="submit"
                  >
                    🗑
                  </button>
                </form>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
