import Link from "next/link";
import { EnrichedPeopleStorePanel } from "@/features/enrich/components/enriched-people-store-panel";

export default async function EnrichedPeopleStorePage() {
  return (
    <main className="shell workspace-shell">
      <section className="workspace-panel search-hero">
        <div className="workspace-header">
          <p className="eyebrow">Global enriched-people store</p>
          <h1>Inspect the append-only enrichment cache.</h1>
          <p>
            Every Apollo person ID stored here is treated as already handled for
            future enrichment runs, including unusable outcomes. This route is
            separate from mutable contact batches by design.
          </p>
          <div className="workspace-actions">
            <Link className="secondary-button" href="/enrich">
              Open enrichment workflow
            </Link>
            <Link className="secondary-button" href="/search/people">
              Open people workflow
            </Link>
          </div>
        </div>
      </section>
      <EnrichedPeopleStorePanel />
    </main>
  );
}
