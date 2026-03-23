import { runCompanySearchAction } from "@/app/recipes/actions";
import {
  companyFilterDefinitions,
  employeeRangeOptions,
} from "@/lib/apollo/company-filter-definitions";
import type { CompanySnapshotRecord } from "@/lib/db/repositories/company-snapshots";
import type { Recipe } from "@/lib/recipes/schema";

type CompanySearchPanelProps = {
  recipe: Recipe | null;
  snapshot: CompanySnapshotRecord | null;
};

export function CompanySearchPanel({
  recipe,
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
    <section className="card">
      <div className="workspace-header">
        <p className="eyebrow">Company search</p>
        <h2>Explicit search, explicit refresh</h2>
        <p>
          Search runs only on click. Matching snapshots are reused by default,
          and latest refresh is a separate action.
        </p>
      </div>

      <form action={runCompanySearchAction} className="stack">
        <input type="hidden" name="recipeId" value={recipe.id} />
        <div className="form-intro">
          <span className="badge">Credit-bearing search</span>
          <p className="meta">
            Start narrow, reuse snapshots when possible, and only refresh when
            you intentionally want fresh Apollo data.
          </p>
        </div>

        <section className="filter-section">
          <div className="section-heading">
            <h3>Exact company targeting</h3>
            <p className="field-hint">
              Use these when you already know the organization you want.
            </p>
          </div>
          <div className="field-grid">
            {companyFilterDefinitions
              .filter((definition) =>
                ["organizationName", "organizationWebsite", "organizationIds"].includes(
                  String(definition.key),
                ),
              )
              .map((definition) => {
                const value =
                  recipe.companyFilters[
                    definition.key as keyof typeof recipe.companyFilters
                  ];
                const stringValue = Array.isArray(value)
                  ? value.join("\n")
                  : String(value ?? "");

                return (
                  <div
                    key={definition.key}
                    className={`field${definition.input === "multi-text" ? " full" : ""}`}
                  >
                    <label htmlFor={String(definition.key)}>{definition.label}</label>
                    {definition.input === "text" ? (
                      <input
                        defaultValue={stringValue}
                        id={String(definition.key)}
                        name={String(definition.key)}
                        placeholder={definition.placeholder}
                      />
                    ) : (
                      <textarea
                        defaultValue={stringValue}
                        id={String(definition.key)}
                        name={String(definition.key)}
                        placeholder={definition.placeholder}
                      />
                    )}
                    <span className="field-hint">{definition.description}</span>
                  </div>
                );
              })}
          </div>
        </section>

        <section className="filter-section">
          <div className="section-heading">
            <h3>Broader discovery filters</h3>
            <p className="field-hint">
              Combine location, size, keywords, and industry to explore while
              keeping the result set manageable.
            </p>
          </div>
          <div className="field-grid">
            {companyFilterDefinitions
              .filter(
                (definition) =>
                  !["organizationName", "organizationWebsite", "organizationIds"].includes(
                    String(definition.key),
                  ),
              )
              .map((definition) => {
                const value =
                  recipe.companyFilters[
                    definition.key as keyof typeof recipe.companyFilters
                  ];

                if (definition.key === "organizationNumEmployeesRanges") {
                  const selected = Array.isArray(value) ? value : [];

                  return (
                    <div key={definition.key} className="field full">
                      <label>{definition.label}</label>
                      <div className="option-grid">
                        {employeeRangeOptions.map((option) => (
                          <label key={option.value} className="option-pill">
                            <input
                              defaultChecked={selected.includes(option.value)}
                              name={String(definition.key)}
                              type="checkbox"
                              value={option.value}
                            />
                            <span>{option.label}</span>
                          </label>
                        ))}
                      </div>
                      <span className="field-hint">{definition.description}</span>
                    </div>
                  );
                }

                const stringValue = Array.isArray(value)
                  ? value.join("\n")
                  : String(value ?? "");

                return (
                  <div
                    key={definition.key}
                    className={`field${definition.input === "multi-text" ? " full" : ""}`}
                  >
                    <label htmlFor={String(definition.key)}>{definition.label}</label>
                    <textarea
                      defaultValue={stringValue}
                      id={String(definition.key)}
                      name={String(definition.key)}
                      placeholder={definition.placeholder}
                    />
                    <span className="field-hint">{definition.description}</span>
                  </div>
                );
              })}
          </div>
        </section>

        <div className="workspace-actions">
          <button className="primary-button" name="mode" type="submit" value="reuse">
            Run company search
          </button>
          <button className="secondary-button" name="mode" type="submit" value="latest">
            Get latest snapshot
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
          Live company search consumes credits. Verification should reuse stored
          snapshots or the fixture path whenever possible.
        </p>
      </div>
    </section>
  );
}
