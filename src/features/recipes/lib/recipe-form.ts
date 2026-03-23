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
  return formData
    .getAll(key)
    .flatMap((value) => splitLines(value))
    .filter(Boolean);
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
      organizationLocations: [],
      organizationNumEmployeesRanges: [],
      organizationIds: [],
      qOrganizationKeywordTags: [],
      organizationNotKeywordTags: [],
      organizationIndustryTagIds: [],
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
      personLocations: [],
      personSeniorities: [],
      personDepartments: [],
    },
    exportSettings: {
      columns: ["full_name", "title", "company_name", "email"],
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
    exportSettings: recipe.exportSettings,
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
        organizationLocations: getMultiValueEntries(formData, "organizationLocations"),
        organizationNumEmployeesRanges: formData
          .getAll("organizationNumEmployeesRanges")
          .map(String),
        organizationIds: getMultiValueEntries(formData, "organizationIds"),
        qOrganizationKeywordTags: getMultiValueEntries(formData, "qOrganizationKeywordTags"),
        organizationNotKeywordTags: getMultiValueEntries(formData, "organizationNotKeywordTags"),
        organizationIndustryTagIds: getMultiValueEntries(formData, "organizationIndustryTagIds"),
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
      personLocations: getMultiValueEntries(formData, "personLocations"),
      personSeniorities: formData.getAll("personSeniorities").map(String),
      personDepartments: formData.getAll("personDepartments").map(String),
    },
    exportSettings: {
      columns: getMultiValueEntries(formData, "exportColumns"),
    },
  });
}
