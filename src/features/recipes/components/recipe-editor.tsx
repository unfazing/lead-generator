import { deleteRecipeAction, saveRecipeAction } from "@/app/recipes/actions";
import { MultiValueInput } from "@/features/recipes/components/multi-value-input";
import { InfoTip } from "@/features/ui/components/info-tip";
import { employeeRangeOptions } from "@/lib/apollo/company-filter-definitions";
import {
  contactEmailStatusFilterOptions,
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
  if (recipe) {
    return recipe.name;
  }

  return "New recipe";
}

export function RecipeEditor(props: RecipeEditorProps) {
  const { type, recipe, pairedRecipeId } = props;

  return (
    <section className="card">
      <div className="workspace-header">
        <p className="eyebrow">{type === "company" ? "Company recipe" : "People recipe"}</p>
        <h1>{getTitle(type, recipe)}</h1>
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
            <h3 className="heading-with-tip">
              <span>Recipe details</span>
              <InfoTip
                content="Name the saved search and keep a short operating note with it."
                label="Recipe details help"
              />
            </h3>
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
              <h3 className="heading-with-tip">
                <span>Company filter defaults</span>
                <InfoTip
                  content="These defaults feed company snapshot searches and can later be paired with any people recipe."
                  label="Company filter defaults help"
                />
              </h3>
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
                hint="Add one employer domain at a time without www or @."
                label="Organization domains"
                name="qOrganizationDomainsList"
                placeholder="apollo.io"
                values={props.draft.companyFilters.qOrganizationDomainsList}
              />
              <MultiValueInput
                hint="Add one location at a time for cleaner geographic targeting."
                label="Company locations"
                name="organizationLocations"
                placeholder="Singapore"
                values={props.draft.companyFilters.organizationLocations}
              />
              <MultiValueInput
                hint="Exclude specific headquarters locations from results."
                label="Excluded company locations"
                name="organizationNotLocations"
                placeholder="Ireland"
                values={props.draft.companyFilters.organizationNotLocations}
              />
              <MultiValueInput
                hint="Add include keywords one by one instead of managing a comma-delimited list."
                label="Company keywords"
                name="qOrganizationKeywordTags"
                placeholder="saas"
                values={props.draft.companyFilters.qOrganizationKeywordTags}
              />
              <MultiValueInput
                hint="Filter on active job posting titles at the company."
                label="Active job titles"
                name="qOrganizationJobTitles"
                placeholder="sales manager"
                values={props.draft.companyFilters.qOrganizationJobTitles}
              />
              <MultiValueInput
                hint="Filter on locations of active jobs at the company."
                label="Job posting locations"
                name="organizationJobLocations"
                placeholder="Atlanta"
                values={props.draft.companyFilters.organizationJobLocations}
              />
              <div className="field full">
                <label className="label-with-tip">
                  <span>Employee ranges</span>
                  <InfoTip
                    content="Constrained Apollo employee-band values."
                    label="Employee ranges help"
                  />
                </label>
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
              <MultiValueInput
                hint="Apollo technology UIDs use underscores in place of spaces and periods."
                label="Technology UIDs"
                name="currentlyUsingAnyOfTechnologyUids"
                placeholder="google_analytics"
                values={props.draft.companyFilters.currentlyUsingAnyOfTechnologyUids}
              />
              <div className="field">
                <label htmlFor="revenueRangeMin">Revenue min</label>
                <input
                  defaultValue={props.draft.companyFilters.revenueRangeMin ?? ""}
                  id="revenueRangeMin"
                  min="0"
                  name="revenueRangeMin"
                  placeholder="300000"
                  type="number"
                />
              </div>
              <div className="field">
                <label htmlFor="revenueRangeMax">Revenue max</label>
                <input
                  defaultValue={props.draft.companyFilters.revenueRangeMax ?? ""}
                  id="revenueRangeMax"
                  min="0"
                  name="revenueRangeMax"
                  placeholder="50000000"
                  type="number"
                />
              </div>
              <div className="field">
                <label htmlFor="latestFundingAmountRangeMin">Latest funding min</label>
                <input
                  defaultValue={props.draft.companyFilters.latestFundingAmountRangeMin ?? ""}
                  id="latestFundingAmountRangeMin"
                  min="0"
                  name="latestFundingAmountRangeMin"
                  placeholder="5000000"
                  type="number"
                />
              </div>
              <div className="field">
                <label htmlFor="latestFundingAmountRangeMax">Latest funding max</label>
                <input
                  defaultValue={props.draft.companyFilters.latestFundingAmountRangeMax ?? ""}
                  id="latestFundingAmountRangeMax"
                  min="0"
                  name="latestFundingAmountRangeMax"
                  placeholder="15000000"
                  type="number"
                />
              </div>
              <div className="field">
                <label htmlFor="totalFundingRangeMin">Total funding min</label>
                <input
                  defaultValue={props.draft.companyFilters.totalFundingRangeMin ?? ""}
                  id="totalFundingRangeMin"
                  min="0"
                  name="totalFundingRangeMin"
                  placeholder="50000000"
                  type="number"
                />
              </div>
              <div className="field">
                <label htmlFor="totalFundingRangeMax">Total funding max</label>
                <input
                  defaultValue={props.draft.companyFilters.totalFundingRangeMax ?? ""}
                  id="totalFundingRangeMax"
                  min="0"
                  name="totalFundingRangeMax"
                  placeholder="350000000"
                  type="number"
                />
              </div>
              <div className="field">
                <label htmlFor="organizationNumJobsRangeMin">Active jobs min</label>
                <input
                  defaultValue={props.draft.companyFilters.organizationNumJobsRangeMin ?? ""}
                  id="organizationNumJobsRangeMin"
                  min="0"
                  name="organizationNumJobsRangeMin"
                  placeholder="50"
                  type="number"
                />
              </div>
              <div className="field">
                <label htmlFor="organizationNumJobsRangeMax">Active jobs max</label>
                <input
                  defaultValue={props.draft.companyFilters.organizationNumJobsRangeMax ?? ""}
                  id="organizationNumJobsRangeMax"
                  min="0"
                  name="organizationNumJobsRangeMax"
                  placeholder="500"
                  type="number"
                />
              </div>
              <div className="field">
                <label htmlFor="latestFundingDateRangeMin">Latest funding from</label>
                <input
                  defaultValue={props.draft.companyFilters.latestFundingDateRangeMin ?? ""}
                  id="latestFundingDateRangeMin"
                  name="latestFundingDateRangeMin"
                  type="date"
                />
              </div>
              <div className="field">
                <label htmlFor="latestFundingDateRangeMax">Latest funding to</label>
                <input
                  defaultValue={props.draft.companyFilters.latestFundingDateRangeMax ?? ""}
                  id="latestFundingDateRangeMax"
                  name="latestFundingDateRangeMax"
                  type="date"
                />
              </div>
              <div className="field">
                <label htmlFor="organizationJobPostedAtRangeMin">Jobs posted from</label>
                <input
                  defaultValue={props.draft.companyFilters.organizationJobPostedAtRangeMin ?? ""}
                  id="organizationJobPostedAtRangeMin"
                  name="organizationJobPostedAtRangeMin"
                  type="date"
                />
              </div>
              <div className="field">
                <label htmlFor="organizationJobPostedAtRangeMax">Jobs posted to</label>
                <input
                  defaultValue={props.draft.companyFilters.organizationJobPostedAtRangeMax ?? ""}
                  id="organizationJobPostedAtRangeMax"
                  name="organizationJobPostedAtRangeMax"
                  type="date"
                />
              </div>
            </div>
          </section>
        ) : (
          <section className="filter-section">
            <div className="section-heading">
              <h3 className="heading-with-tip">
                <span>People filter defaults</span>
                <InfoTip
                  content="These defaults define the people search that can later be mixed with any company snapshot."
                  label="People filter defaults help"
                />
              </h3>
            </div>
            <div className="field-grid">
              <MultiValueInput
                hint="Maps to Apollo `person_titles` array values."
                label="People titles"
                name="personTitles"
                placeholder="sales director"
                values={props.draft.peopleFilters.personTitles}
              />
              <div className="field full">
                <div className="inline-toggle-card">
                  <div className="inline-toggle-copy">
                    <strong className="label-with-tip">
                      <span>Include similar titles</span>
                      <InfoTip
                        content="Turn this off when you want strict title matching only."
                        label="Include similar titles help"
                      />
                    </strong>
                  </div>
                  <label className="inline-toggle">
                    <input
                      defaultChecked={props.draft.peopleFilters.includeSimilarTitles}
                      name="includeSimilarTitles"
                      type="checkbox"
                    />
                    <span>{props.draft.peopleFilters.includeSimilarTitles ? "On" : "Off"}</span>
                  </label>
                </div>
              </div>
              <div className="field">
                <label htmlFor="qKeywords">Keyword query</label>
                <input
                  defaultValue={props.draft.peopleFilters.qKeywords}
                  id="qKeywords"
                  name="qKeywords"
                  placeholder="sales strategy"
                />
              </div>
              <MultiValueInput
                hint="Maps to Apollo `person_locations` array values."
                label="People locations"
                name="personLocations"
                placeholder="California, US"
                values={props.draft.peopleFilters.personLocations}
              />
              <MultiValueInput
                hint="Filter by the headquarters location of the current employer."
                label="Employer HQ locations"
                name="organizationLocations"
                placeholder="Tokyo"
                values={props.draft.peopleFilters.organizationLocations}
              />
              <MultiValueInput
                hint="Add employer domains without www or @."
                label="Employer domains"
                name="qOrganizationDomainsList"
                placeholder="apollo.io"
                values={props.draft.peopleFilters.qOrganizationDomainsList}
              />
              <MultiValueInput
                hint="Paste Apollo organization IDs one by one."
                label="Employer organization IDs"
                name="organizationIds"
                placeholder="5e66b6381e05b4008c8331b8"
                values={props.draft.peopleFilters.organizationIds}
              />
              <div className="field full">
                <label>Employer headcount ranges</label>
                <div className="option-grid">
                  {employeeRangeOptions.map((option) => (
                    <label key={option.value} className="option-pill">
                      <input
                        defaultChecked={hasSelectedValue(
                          props.draft.peopleFilters.organizationNumEmployeesRanges,
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
                <span className="field-hint">
                  Match people based on the headcount of their current employer.
                </span>
              </div>
              <div className="field full">
                <label className="label-with-tip">
                  <span>Email status</span>
                  <InfoTip
                    content="Limit preview results to specific Apollo email-status buckets."
                    label="Email status help"
                  />
                </label>
                <div className="option-grid">
                  {contactEmailStatusFilterOptions.map((option) => (
                    <label key={option.value} className="option-pill">
                      <input
                        defaultChecked={hasSelectedValue(
                          props.draft.peopleFilters.contactEmailStatus,
                          option.value,
                        )}
                        name="contactEmailStatus"
                        type="checkbox"
                        value={option.value}
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="field full">
                <label className="label-with-tip">
                  <span>People seniority</span>
                  <InfoTip
                    content="Constrained values for Apollo person_seniorities."
                    label="People seniority help"
                  />
                </label>
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
              </div>
              <MultiValueInput
                hint="Employer technologies where all listed values must be present."
                label="Technologies: all of"
                name="currentlyUsingAllOfTechnologyUids"
                placeholder="salesforce"
                values={props.draft.peopleFilters.currentlyUsingAllOfTechnologyUids}
              />
              <MultiValueInput
                hint="Employer technologies where any listed value can match."
                label="Technologies: any of"
                name="currentlyUsingAnyOfTechnologyUids"
                placeholder="google_analytics"
                values={props.draft.peopleFilters.currentlyUsingAnyOfTechnologyUids}
              />
              <MultiValueInput
                hint="Exclude employers using any of these technologies."
                label="Technologies: exclude"
                name="currentlyNotUsingAnyOfTechnologyUids"
                placeholder="wordpress_org"
                values={props.draft.peopleFilters.currentlyNotUsingAnyOfTechnologyUids}
              />
              <MultiValueInput
                hint="Active job posting titles at the current employer."
                label="Employer job titles"
                name="qOrganizationJobTitles"
                placeholder="research analyst"
                values={props.draft.peopleFilters.qOrganizationJobTitles}
              />
              <MultiValueInput
                hint="Locations of active job postings at the current employer."
                label="Employer job locations"
                name="organizationJobLocations"
                placeholder="Japan"
                values={props.draft.peopleFilters.organizationJobLocations}
              />
              <div className="field">
                <label htmlFor="peopleRevenueRangeMin">Employer revenue min</label>
                <input
                  defaultValue={props.draft.peopleFilters.revenueRangeMin ?? ""}
                  id="peopleRevenueRangeMin"
                  min="0"
                  name="peopleRevenueRangeMin"
                  placeholder="500000"
                  type="number"
                />
              </div>
              <div className="field">
                <label htmlFor="peopleRevenueRangeMax">Employer revenue max</label>
                <input
                  defaultValue={props.draft.peopleFilters.revenueRangeMax ?? ""}
                  id="peopleRevenueRangeMax"
                  min="0"
                  name="peopleRevenueRangeMax"
                  placeholder="1500000"
                  type="number"
                />
              </div>
              <div className="field">
                <label htmlFor="organizationNumJobsRangeMin">Employer active jobs min</label>
                <input
                  defaultValue={props.draft.peopleFilters.organizationNumJobsRangeMin ?? ""}
                  id="organizationNumJobsRangeMin"
                  min="0"
                  name="organizationNumJobsRangeMin"
                  placeholder="50"
                  type="number"
                />
              </div>
              <div className="field">
                <label htmlFor="organizationNumJobsRangeMax">Employer active jobs max</label>
                <input
                  defaultValue={props.draft.peopleFilters.organizationNumJobsRangeMax ?? ""}
                  id="organizationNumJobsRangeMax"
                  min="0"
                  name="organizationNumJobsRangeMax"
                  placeholder="500"
                  type="number"
                />
              </div>
              <div className="field">
                <label htmlFor="organizationJobPostedAtRangeMin">Employer jobs posted from</label>
                <input
                  defaultValue={props.draft.peopleFilters.organizationJobPostedAtRangeMin ?? ""}
                  id="organizationJobPostedAtRangeMin"
                  name="organizationJobPostedAtRangeMin"
                  type="date"
                />
              </div>
              <div className="field">
                <label htmlFor="organizationJobPostedAtRangeMax">Employer jobs posted to</label>
                <input
                  defaultValue={props.draft.peopleFilters.organizationJobPostedAtRangeMax ?? ""}
                  id="organizationJobPostedAtRangeMax"
                  name="organizationJobPostedAtRangeMax"
                  type="date"
                />
              </div>
            </div>
          </section>
        )}

        <div className="workspace-actions">
          <button className="primary-button" type="submit">
            {recipe ? "Update recipe" : "Save recipe"}
          </button>
          {recipe ? (
            <button className="secondary-button destructive-button" formAction={deleteRecipeAction}>
              Delete recipe
            </button>
          ) : null}
        </div>
      </form>
    </section>
  );
}
