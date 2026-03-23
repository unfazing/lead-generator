import { runCompanySearchAction } from "@/app/recipes/actions";
import { InfoTip } from "@/features/ui/components/info-tip";
import {
  companyFilterDefinitions,
} from "@/lib/apollo/company-filter-definitions";
import type { CompanySnapshotRecord } from "@/lib/db/repositories/company-snapshots";
import type { CompanyRecipe } from "@/lib/recipes/schema";

type CompanySearchPanelProps = {
  recipe: CompanyRecipe | null;
  snapshot: CompanySnapshotRecord | null;
};

function formatFilterLabel(key: string) {
  return key
    .split(/(?=[A-Z])|_/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getDisplayValue(value: unknown) {
  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(", ") : "None";
  }

  return String(value ?? "").trim() || "None";
}

function hasMeaningfulValue(value: unknown) {
  if (Array.isArray(value)) {
    return value.length > 0;
  }

  if (typeof value === "number") {
    return true;
  }

  if (typeof value === "boolean") {
    return value;
  }

  return String(value ?? "").trim().length > 0;
}

export function CompanySearchPanel({
  recipe,
  snapshot: _snapshot,
}: CompanySearchPanelProps) {
  if (!recipe) {
    return (
      <div className="card empty-message">
        Save a recipe first so company search has a source of truth.
      </div>
    );
  }

  const labelMap = new Map(
    companyFilterDefinitions.map((definition) => [definition.key, definition.label]),
  );
  const sortedFilters = Object.entries(recipe.companyFilters).sort(
    ([leftKey], [rightKey]) => {
      const leftLabel =
        labelMap.get(leftKey as keyof typeof recipe.companyFilters) ??
        formatFilterLabel(leftKey);
      const rightLabel =
        labelMap.get(rightKey as keyof typeof recipe.companyFilters) ??
        formatFilterLabel(rightKey);

      return leftLabel.localeCompare(rightLabel);
    },
  );
  const populatedFilters = sortedFilters.filter(([, value]) =>
    hasMeaningfulValue(value),
  );
  const emptyFilters = sortedFilters.filter(([, value]) => !hasMeaningfulValue(value));

  return (
    <section className="card stack">
      <div className="workspace-header">
        <p className="eyebrow">Company search</p>
        <div className="heading-with-tip">
          <h2>Run a company search</h2>
          <span className="badge">Uses Apollo company-search credits</span>
          <InfoTip
            content="Run a fresh Apollo search for the selected recipe. Saved snapshots can be reopened from the snapshot list below."
            label="Company search actions help"
          />
        </div>
      </div>

      <form action={runCompanySearchAction} className="stack">
        <input type="hidden" name="companyRecipeId" value={recipe.id} />

        <div className="pairing-summary">
          <div className="stat-tile">
            <span className="meta">Company recipe</span>
            <strong>{recipe.name}</strong>
          </div>
        </div>

        <section className="filter-section">
          <details className="filter-details">
            <summary className="filter-details-summary">
              Active recipe fields
            </summary>
            <div className="field-grid filter-details-body">
              {populatedFilters.map(([key, value]) => {
                const label =
                  labelMap.get(key as keyof typeof recipe.companyFilters) ??
                  formatFilterLabel(key);
                const displayValue = getDisplayValue(value);

                return (
                  <div
                    key={key}
                    className={`field search-filter-summary${
                      Array.isArray(value) ? " full" : ""
                    }`}
                  >
                    <label>{label}</label>
                    <div className="summary-value">{displayValue}</div>
                  </div>
                );
              })}
            </div>
          </details>
          <details className="filter-details">
            <summary className="filter-details-summary">
              Unused recipe fields
            </summary>
            <div className="field-grid filter-details-body">
              {emptyFilters.map(([key, value]) => {
                const label =
                  labelMap.get(key as keyof typeof recipe.companyFilters) ??
                  formatFilterLabel(key);
                const displayValue = getDisplayValue(value);

                return (
                  <div
                    key={key}
                    className={`field search-filter-summary${
                      Array.isArray(value) ? " full" : ""
                    }`}
                  >
                    <label>{label}</label>
                    <div className="summary-value">{displayValue}</div>
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
        </div>
      </form>
    </section>
  );
}
