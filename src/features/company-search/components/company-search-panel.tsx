import { runCompanySearchAction } from "@/app/recipes/actions";
import {
  companyFilterDefinitions,
} from "@/lib/apollo/company-filter-definitions";
import type { CompanySnapshotRecord } from "@/lib/db/repositories/company-snapshots";
import type { CompanyRecipe, PeopleRecipe } from "@/lib/recipes/schema";

type CompanySearchPanelProps = {
  recipe: CompanyRecipe | null;
  pairedPeopleRecipe: PeopleRecipe | null;
  snapshot: CompanySnapshotRecord | null;
};

export function CompanySearchPanel({
  recipe,
  pairedPeopleRecipe,
  snapshot,
}: CompanySearchPanelProps) {
  if (!recipe) {
    return (
      <div className="card empty-message">
        Save a recipe first so company search has a source of truth.
      </div>
    );
  }

  return (
    <section className="card stack">
      <div className="workspace-header">
        <p className="eyebrow">Company search</p>
        <h2>Live search with explicit snapshot reuse</h2>
        <p>
          Run company search to fetch fresh Apollo data for the selected
          company recipe. Use the separate stored-snapshot action when you want
          to reopen the latest matching result already saved in this app.
        </p>
      </div>

      <form action={runCompanySearchAction} className="stack">
        <input type="hidden" name="companyRecipeId" value={recipe.id} />
        {pairedPeopleRecipe ? (
          <input type="hidden" name="peopleRecipeId" value={pairedPeopleRecipe.id} />
        ) : null}
        <div className="form-intro">
          <span className="badge">Credit-bearing search</span>
          <p className="meta">
            Start narrow. The primary action performs a live Apollo search and
            saves a fresh snapshot; the secondary action only reopens the
            latest stored snapshot for the same recipe filters.
          </p>
        </div>

        <div className="pairing-summary">
          <div className="stat-tile">
            <span className="meta">Company recipe</span>
            <strong>{recipe.name}</strong>
          </div>
          <div className="stat-tile">
            <span className="meta">People recipe</span>
            <strong>{pairedPeopleRecipe?.name ?? "None paired yet"}</strong>
          </div>
        </div>

        <section className="filter-section">
          <div className="section-heading">
            <h3>Recipe filters in use</h3>
            <p className="field-hint">
              Edit the company recipe on the recipe page if you want to change
              query parameters. Search here only runs live Apollo fetches or reopens stored snapshots for
              the selected recipe.
            </p>
          </div>
          <details className="filter-details">
            <summary className="filter-details-summary">
              View saved company-search filters
            </summary>
            <div className="field-grid filter-details-body">
              {companyFilterDefinitions.map((definition) => {
                const value =
                  recipe.companyFilters[
                    definition.key as keyof typeof recipe.companyFilters
                  ];
                const displayValue = Array.isArray(value)
                  ? value.length > 0
                    ? value.join(", ")
                    : "None"
                  : String(value ?? "").trim() || "None";

                return (
                  <div
                    key={definition.key}
                    className={`field search-filter-summary${definition.input === "multi-text" ? " full" : ""}`}
                  >
                    <label>{definition.label}</label>
                    <div className="summary-value">{displayValue}</div>
                    <span className="field-hint">{definition.description}</span>
                  </div>
                );
              })}
            </div>
          </details>
        </section>

        <div className="workspace-actions">
          <button className="primary-button" name="mode" type="submit" value="live">
            Run company search
          </button>
          <button className="secondary-button" name="mode" type="submit" value="stored">
            Open stored snapshot
          </button>
        </div>
      </form>

      <div className="subtle-card card">
        <p className="meta">
          {snapshot
            ? `Current snapshot fetched ${new Date(snapshot.updatedAt).toLocaleString()}`
            : "No saved company snapshot yet for this recipe."}
        </p>
        <p className="field-hint">
          Live company search consumes credits. Stored snapshots let you review
          existing results without spending more Apollo usage.
        </p>
      </div>
    </section>
  );
}
