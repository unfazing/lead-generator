import { saveRecipeAction } from "@/app/recipes/actions";
import type { Recipe, RecipeInput } from "@/lib/recipes/schema";

type RecipeEditorProps = {
  recipe: Recipe | null;
  draft: RecipeInput;
};

function joinValues(values: string[]) {
  return values.join("\n");
}

export function RecipeEditor({ recipe, draft }: RecipeEditorProps) {
  return (
    <section className="card">
      <div className="workspace-header">
        <p className="eyebrow">Recipe editor</p>
        <h1>{recipe ? "Refine saved workflow" : "Create reusable workflow"}</h1>
        <p>
          Save company filters, people filters, and export columns together so
          future search and export phases inherit one durable source of truth.
        </p>
      </div>

      <form action={saveRecipeAction} className="stack">
        {recipe ? <input type="hidden" name="recipeId" value={recipe.id} /> : null}
        <div className="field-grid">
          <div className="field">
            <label htmlFor="name">Recipe name</label>
            <input
              defaultValue={draft.name}
              id="name"
              name="name"
              placeholder="APAC SaaS founders"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="exportColumns">Export columns</label>
            <textarea
              defaultValue={joinValues(draft.exportSettings.columns)}
              id="exportColumns"
              name="exportColumns"
            />
            <span className="field-hint">Comma or newline separated.</span>
          </div>
          <div className="field full">
            <label htmlFor="notes">Notes</label>
            <textarea
              defaultValue={draft.notes}
              id="notes"
              name="notes"
              placeholder="Why this recipe matters, exclusions, or operator notes"
            />
          </div>
          <div className="field">
            <label htmlFor="organizationName">Organization name</label>
            <input
              defaultValue={draft.companyFilters.organizationName}
              id="organizationName"
              name="organizationName"
              placeholder="Acme, Apollo, Stripe"
            />
          </div>
          <div className="field">
            <label htmlFor="organizationWebsite">Organization website</label>
            <input
              defaultValue={draft.companyFilters.organizationWebsite}
              id="organizationWebsite"
              name="organizationWebsite"
              placeholder="example.com"
            />
          </div>
          <div className="field">
            <label htmlFor="qOrganizationKeywordTags">Company keywords</label>
            <textarea
              defaultValue={joinValues(draft.companyFilters.qOrganizationKeywordTags)}
              id="qOrganizationKeywordTags"
              name="qOrganizationKeywordTags"
            />
          </div>
          <div className="field">
            <label htmlFor="organizationLocations">Company locations</label>
            <textarea
              defaultValue={joinValues(draft.companyFilters.organizationLocations)}
              id="organizationLocations"
              name="organizationLocations"
            />
          </div>
          <div className="field">
            <label htmlFor="organizationNumEmployeesRanges">Employee ranges</label>
            <textarea
              defaultValue={joinValues(
                draft.companyFilters.organizationNumEmployeesRanges,
              )}
              id="organizationNumEmployeesRanges"
              name="organizationNumEmployeesRanges"
            />
          </div>
          <div className="field">
            <label htmlFor="organizationIndustryTagIds">Industry tag IDs</label>
            <textarea
              defaultValue={joinValues(draft.companyFilters.organizationIndustryTagIds)}
              id="organizationIndustryTagIds"
              name="organizationIndustryTagIds"
            />
          </div>
          <div className="field">
            <label htmlFor="organizationNotKeywordTags">Excluded keywords</label>
            <textarea
              defaultValue={joinValues(draft.companyFilters.organizationNotKeywordTags)}
              id="organizationNotKeywordTags"
              name="organizationNotKeywordTags"
            />
          </div>
          <div className="field">
            <label htmlFor="organizationIds">Organization IDs</label>
            <textarea
              defaultValue={joinValues(draft.companyFilters.organizationIds)}
              id="organizationIds"
              name="organizationIds"
            />
          </div>
          <div className="field">
            <label htmlFor="peopleTitles">People titles</label>
            <textarea
              defaultValue={joinValues(draft.peopleFilters.titles)}
              id="peopleTitles"
              name="peopleTitles"
            />
          </div>
          <div className="field">
            <label htmlFor="peopleSeniority">People seniority</label>
            <textarea
              defaultValue={joinValues(draft.peopleFilters.seniority)}
              id="peopleSeniority"
              name="peopleSeniority"
            />
          </div>
          <div className="field">
            <label htmlFor="peopleDepartments">People departments</label>
            <textarea
              defaultValue={joinValues(draft.peopleFilters.departments)}
              id="peopleDepartments"
              name="peopleDepartments"
            />
          </div>
        </div>
        <div className="workspace-actions">
          <button className="primary-button" type="submit">
            {recipe ? "Update recipe" : "Save recipe"}
          </button>
        </div>
      </form>
    </section>
  );
}
