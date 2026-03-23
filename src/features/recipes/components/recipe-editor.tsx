import { saveRecipeAction } from "@/app/recipes/actions";
import { MultiValueInput } from "@/features/recipes/components/multi-value-input";
import { employeeRangeOptions } from "@/lib/apollo/company-filter-definitions";
import {
  peopleDepartmentFilterOptions,
  peopleSeniorityFilterOptions,
} from "@/lib/apollo/people-filter-definitions";
import type {
  CompanyRecipe,
  CompanyRecipeInput,
  PeopleRecipe,
  PeopleRecipeInput,
  RecipeType,
} from "@/lib/recipes/schema";

type RecipeEditorProps =
  | {
      type: "company";
      recipe: CompanyRecipe | null;
      draft: CompanyRecipeInput;
      pairedRecipeId: string | null;
    }
  | {
      type: "people";
      recipe: PeopleRecipe | null;
      draft: PeopleRecipeInput;
      pairedRecipeId: string | null;
    };

function hasSelectedValue(values: readonly string[], value: string) {
  return values.includes(value);
}

function getTitle(type: RecipeType, recipe: CompanyRecipe | PeopleRecipe | null) {
  if (type === "company") {
    return recipe ? "Refine company search recipe" : "Create company search recipe";
  }

  return recipe ? "Refine people search recipe" : "Create people search recipe";
}

export function RecipeEditor(props: RecipeEditorProps) {
  const { type, recipe, pairedRecipeId } = props;

  return (
    <section className="card">
      <div className="workspace-header">
        <p className="eyebrow">{type === "company" ? "Company recipe" : "People recipe"}</p>
        <h1>{getTitle(type, recipe)}</h1>
        <p>
          {type === "company"
            ? "Save reusable company filters separately so any people search can be paired with them later."
            : "Save reusable people filters separately so they can be mixed with any company result set later."}
        </p>
      </div>

      <form action={saveRecipeAction} className="stack">
        <input type="hidden" name="recipeType" value={type} />
        {recipe ? <input type="hidden" name="recipeId" value={recipe.id} /> : null}
        {pairedRecipeId ? (
          <input
            type="hidden"
            name={type === "company" ? "pairedPeopleRecipeId" : "pairedCompanyRecipeId"}
            value={pairedRecipeId}
          />
        ) : null}

        <section className="filter-section">
          <div className="section-heading">
            <h3>Recipe details</h3>
            <p className="field-hint">Name the saved search and keep a short operating note with it.</p>
          </div>
          <div className="field-grid">
            <div className="field">
              <label htmlFor={`${type}-name`}>Recipe name</label>
              <input
                defaultValue={props.draft.name}
                id={`${type}-name`}
                name="name"
                placeholder={type === "company" ? "APAC SaaS companies" : "APAC founder search"}
                required
              />
            </div>
            <div className="field full">
              <label htmlFor={`${type}-notes`}>Notes</label>
              <textarea
                defaultValue={props.draft.notes}
                id={`${type}-notes`}
                name="notes"
                placeholder="Why this recipe matters, exclusions, or operator notes"
              />
            </div>
          </div>
        </section>

        {type === "company" ? (
          <section className="filter-section">
            <div className="section-heading">
              <h3>Company filter defaults</h3>
              <p className="field-hint">
                These defaults feed company snapshot searches and can later be paired with any people recipe.
              </p>
            </div>
            <div className="field-grid">
              <div className="field">
                <label htmlFor="organizationName">Organization name</label>
                <input
                  defaultValue={props.draft.companyFilters.organizationName}
                  id="organizationName"
                  name="organizationName"
                  placeholder="Acme, Apollo, Stripe"
                />
              </div>
              <div className="field">
                <label htmlFor="organizationWebsite">Organization website</label>
                <input
                  defaultValue={props.draft.companyFilters.organizationWebsite}
                  id="organizationWebsite"
                  name="organizationWebsite"
                  placeholder="example.com"
                />
              </div>
              <MultiValueInput
                hint="Add one location at a time for cleaner geographic targeting."
                label="Company locations"
                name="organizationLocations"
                placeholder="Singapore"
                values={props.draft.companyFilters.organizationLocations}
              />
              <MultiValueInput
                hint="Add include keywords one by one instead of managing a comma-delimited list."
                label="Company keywords"
                name="qOrganizationKeywordTags"
                placeholder="saas"
                values={props.draft.companyFilters.qOrganizationKeywordTags}
              />
              <div className="field full">
                <label>Employee ranges</label>
                <div className="option-grid">
                  {employeeRangeOptions.map((option) => (
                    <label key={option.value} className="option-pill">
                      <input
                        defaultChecked={hasSelectedValue(
                          props.draft.companyFilters.organizationNumEmployeesRanges,
                          option.value,
                        )}
                        name="organizationNumEmployeesRanges"
                        type="checkbox"
                        value={option.value}
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
                <span className="field-hint">Constrained Apollo employee-band values.</span>
              </div>
              <MultiValueInput
                hint="Use exact Apollo industry tag IDs when you want precise matching."
                label="Industry tag IDs"
                name="organizationIndustryTagIds"
                placeholder="5567ce5f7369641f6c1eced7"
                values={props.draft.companyFilters.organizationIndustryTagIds}
              />
              <MultiValueInput
                hint="Excluded keywords are stored individually, so they are easier to review later."
                label="Excluded keywords"
                name="organizationNotKeywordTags"
                placeholder="agency"
                values={props.draft.companyFilters.organizationNotKeywordTags}
              />
              <MultiValueInput
                hint="Paste or type Apollo organization IDs one by one."
                label="Organization IDs"
                name="organizationIds"
                placeholder="66f6e1f9f3b2b20001c0f001"
                values={props.draft.companyFilters.organizationIds}
              />
            </div>
          </section>
        ) : (
          <section className="filter-section">
            <div className="section-heading">
              <h3>People filter defaults</h3>
              <p className="field-hint">
                These defaults define the people search that can later be mixed with any company snapshot.
              </p>
            </div>
            <div className="field-grid">
              <MultiValueInput
                hint="Maps to Apollo `person_titles` array values."
                label="People titles"
                name="personTitles"
                placeholder="sales director"
                values={props.draft.peopleFilters.personTitles}
              />
              <MultiValueInput
                hint="Maps to Apollo `person_locations` array values."
                label="People locations"
                name="personLocations"
                placeholder="California, US"
                values={props.draft.peopleFilters.personLocations}
              />
              <div className="field full">
                <label>People seniority</label>
                <div className="option-grid">
                  {peopleSeniorityFilterOptions.map((option) => (
                    <label key={option.value} className="option-pill">
                      <input
                        defaultChecked={hasSelectedValue(
                          props.draft.peopleFilters.personSeniorities,
                          option.value,
                        )}
                        name="personSeniorities"
                        type="checkbox"
                        value={option.value}
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
                <span className="field-hint">Constrained values for Apollo `person_seniorities`.</span>
              </div>
              <div className="field full">
                <label>People departments</label>
                <div className="option-grid">
                  {peopleDepartmentFilterOptions.map((option) => (
                    <label key={option.value} className="option-pill">
                      <input
                        defaultChecked={hasSelectedValue(
                          props.draft.peopleFilters.personDepartments,
                          option.value,
                        )}
                        name="personDepartments"
                        type="checkbox"
                        value={option.value}
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
                <span className="field-hint">Constrained values for Apollo `person_departments`.</span>
              </div>
            </div>
          </section>
        )}

        <div className="workspace-actions">
          <button className="primary-button" type="submit">
            {recipe ? "Update recipe" : "Save recipe"}
          </button>
        </div>
      </form>
    </section>
  );
}
