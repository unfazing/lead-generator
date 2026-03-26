import {
  companyRecipeInputSchema,
  peopleRecipeInputSchema,
  type CompanyRecipe,
  type CompanyRecipeInput,
  type PeopleRecipe,
  type PeopleRecipeInput,
  type RecipeType,
} from "@/lib/recipes/schema";

function splitLines(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return [];
  }

  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function getMultiValueEntries(formData: FormData, key: string) {
  return Array.from(
    new Set(
      formData
        .getAll(key)
        .flatMap((value) => splitLines(value))
        .filter(Boolean),
    ),
  );
}

function getOptionalInteger(formData: FormData, key: string) {
  const value = formData.get(key);
  if (typeof value !== "string" || !value.trim()) {
    return undefined;
  }

  return Number(value);
}

function getOptionalDate(formData: FormData, key: string) {
  const value = formData.get(key);
  if (typeof value !== "string" || !value.trim()) {
    return undefined;
  }

  return value;
}

export function getEmptyCompanyRecipeDraft(): CompanyRecipeInput {
  return {
    type: "company",
    name: "",
    notes: "",
    companyFilters: {
      page: 1,
      perPage: 25,
      organizationName: "",
      organizationWebsite: "",
      qOrganizationDomainsList: [],
      organizationLocations: [],
      organizationNotLocations: [],
      organizationNumEmployeesRanges: [],
      organizationIds: [],
      currentlyUsingAnyOfTechnologyUids: [],
      qOrganizationKeywordTags: [],
      qOrganizationJobTitles: [],
      organizationJobLocations: [],
      organizationNotKeywordTags: [],
      organizationIndustryTagIds: [],
      revenueRangeMin: undefined,
      revenueRangeMax: undefined,
      latestFundingAmountRangeMin: undefined,
      latestFundingAmountRangeMax: undefined,
      totalFundingRangeMin: undefined,
      totalFundingRangeMax: undefined,
      organizationNumJobsRangeMin: undefined,
      organizationNumJobsRangeMax: undefined,
      latestFundingDateRangeMin: undefined,
      latestFundingDateRangeMax: undefined,
      organizationJobPostedAtRangeMin: undefined,
      organizationJobPostedAtRangeMax: undefined,
    },
  };
}

export function getEmptyPeopleRecipeDraft(): PeopleRecipeInput {
  return {
    type: "people",
    name: "",
    notes: "",
    peopleFilters: {
      page: 1,
      perPage: 25,
      personTitles: [],
      includeSimilarTitles: true,
      qKeywords: "",
      personLocations: [],
      personSeniorities: [],
      organizationLocations: [],
      qOrganizationDomainsList: [],
      contactEmailStatus: [],
      organizationIds: [],
      organizationNumEmployeesRanges: [],
      revenueRangeMin: undefined,
      revenueRangeMax: undefined,
      currentlyUsingAllOfTechnologyUids: [],
      currentlyUsingAnyOfTechnologyUids: [],
      currentlyNotUsingAnyOfTechnologyUids: [],
      qOrganizationJobTitles: [],
      organizationJobLocations: [],
      organizationNumJobsRangeMin: undefined,
      organizationNumJobsRangeMax: undefined,
      organizationJobPostedAtRangeMin: undefined,
      organizationJobPostedAtRangeMax: undefined,
    },
  };
}

export function getCompanyRecipeDraft(recipe: CompanyRecipe | null) {
  if (!recipe) {
    return getEmptyCompanyRecipeDraft();
  }

  return companyRecipeInputSchema.parse({
    type: "company",
    name: recipe.name,
    notes: recipe.notes,
    companyFilters: recipe.companyFilters,
  });
}

export function getPeopleRecipeDraft(recipe: PeopleRecipe | null) {
  if (!recipe) {
    return getEmptyPeopleRecipeDraft();
  }

  return peopleRecipeInputSchema.parse({
    type: "people",
    name: recipe.name,
    notes: recipe.notes,
    peopleFilters: recipe.peopleFilters,
  });
}

export function parseRecipeFormData(
  formData: FormData,
  type: "company",
): CompanyRecipeInput;
export function parseRecipeFormData(
  formData: FormData,
  type: "people",
): PeopleRecipeInput;
export function parseRecipeFormData(formData: FormData, type: RecipeType) {
  if (type === "company") {
    return companyRecipeInputSchema.parse({
      type: "company",
      name: formData.get("name"),
      notes: formData.get("notes") ?? "",
      companyFilters: {
        page: 1,
        perPage: 25,
        organizationName: String(formData.get("organizationName") ?? ""),
        organizationWebsite: String(formData.get("organizationWebsite") ?? ""),
        qOrganizationDomainsList: getMultiValueEntries(formData, "qOrganizationDomainsList"),
        organizationLocations: getMultiValueEntries(formData, "organizationLocations"),
        organizationNotLocations: getMultiValueEntries(formData, "organizationNotLocations"),
        organizationNumEmployeesRanges: formData
          .getAll("organizationNumEmployeesRanges")
          .map(String),
        organizationIds: getMultiValueEntries(formData, "organizationIds"),
        currentlyUsingAnyOfTechnologyUids: getMultiValueEntries(
          formData,
          "currentlyUsingAnyOfTechnologyUids",
        ),
        qOrganizationKeywordTags: getMultiValueEntries(formData, "qOrganizationKeywordTags"),
        qOrganizationJobTitles: getMultiValueEntries(formData, "qOrganizationJobTitles"),
        organizationJobLocations: getMultiValueEntries(formData, "organizationJobLocations"),
        organizationNotKeywordTags: getMultiValueEntries(formData, "organizationNotKeywordTags"),
        organizationIndustryTagIds: getMultiValueEntries(formData, "organizationIndustryTagIds"),
        revenueRangeMin: getOptionalInteger(formData, "revenueRangeMin"),
        revenueRangeMax: getOptionalInteger(formData, "revenueRangeMax"),
        latestFundingAmountRangeMin: getOptionalInteger(
          formData,
          "latestFundingAmountRangeMin",
        ),
        latestFundingAmountRangeMax: getOptionalInteger(
          formData,
          "latestFundingAmountRangeMax",
        ),
        totalFundingRangeMin: getOptionalInteger(formData, "totalFundingRangeMin"),
        totalFundingRangeMax: getOptionalInteger(formData, "totalFundingRangeMax"),
        organizationNumJobsRangeMin: getOptionalInteger(
          formData,
          "organizationNumJobsRangeMin",
        ),
        organizationNumJobsRangeMax: getOptionalInteger(
          formData,
          "organizationNumJobsRangeMax",
        ),
        latestFundingDateRangeMin: getOptionalDate(
          formData,
          "latestFundingDateRangeMin",
        ),
        latestFundingDateRangeMax: getOptionalDate(
          formData,
          "latestFundingDateRangeMax",
        ),
        organizationJobPostedAtRangeMin: getOptionalDate(
          formData,
          "organizationJobPostedAtRangeMin",
        ),
        organizationJobPostedAtRangeMax: getOptionalDate(
          formData,
          "organizationJobPostedAtRangeMax",
        ),
      },
    });
  }

  return peopleRecipeInputSchema.parse({
    type: "people",
    name: formData.get("name"),
    notes: formData.get("notes") ?? "",
    peopleFilters: {
      page: 1,
      perPage: 25,
      personTitles: getMultiValueEntries(formData, "personTitles"),
      includeSimilarTitles: formData.get("includeSimilarTitles") === "on",
      qKeywords: String(formData.get("qKeywords") ?? ""),
      personLocations: getMultiValueEntries(formData, "personLocations"),
      personSeniorities: formData.getAll("personSeniorities").map(String),
      organizationLocations: getMultiValueEntries(
        formData,
        "organizationLocations",
      ),
      qOrganizationDomainsList: getMultiValueEntries(
        formData,
        "qOrganizationDomainsList",
      ),
      contactEmailStatus: formData.getAll("contactEmailStatus").map(String),
      organizationIds: getMultiValueEntries(formData, "organizationIds"),
      organizationNumEmployeesRanges: formData
        .getAll("organizationNumEmployeesRanges")
        .map(String),
      revenueRangeMin: getOptionalInteger(formData, "peopleRevenueRangeMin"),
      revenueRangeMax: getOptionalInteger(formData, "peopleRevenueRangeMax"),
      currentlyUsingAllOfTechnologyUids: getMultiValueEntries(
        formData,
        "currentlyUsingAllOfTechnologyUids",
      ),
      currentlyUsingAnyOfTechnologyUids: getMultiValueEntries(
        formData,
        "currentlyUsingAnyOfTechnologyUids",
      ),
      currentlyNotUsingAnyOfTechnologyUids: getMultiValueEntries(
        formData,
        "currentlyNotUsingAnyOfTechnologyUids",
      ),
      qOrganizationJobTitles: getMultiValueEntries(
        formData,
        "qOrganizationJobTitles",
      ),
      organizationJobLocations: getMultiValueEntries(
        formData,
        "organizationJobLocations",
      ),
      organizationNumJobsRangeMin: getOptionalInteger(
        formData,
        "organizationNumJobsRangeMin",
      ),
      organizationNumJobsRangeMax: getOptionalInteger(
        formData,
        "organizationNumJobsRangeMax",
      ),
      organizationJobPostedAtRangeMin: getOptionalDate(
        formData,
        "organizationJobPostedAtRangeMin",
      ),
      organizationJobPostedAtRangeMax: getOptionalDate(
        formData,
        "organizationJobPostedAtRangeMax",
      ),
    },
  });
}
