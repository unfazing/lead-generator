import { recipeInputSchema, type Recipe, type RecipeInput } from "@/lib/recipes/schema";

function splitLines(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return [];
  }

  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function getEmptyRecipeDraft(): RecipeInput {
  return {
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

export function getRecipeDraft(recipe: Recipe | null) {
  if (!recipe) {
    return getEmptyRecipeDraft();
  }

  return recipeInputSchema.parse({
    name: recipe.name,
    notes: recipe.notes,
    companyFilters: recipe.companyFilters,
    peopleFilters: recipe.peopleFilters,
    exportSettings: recipe.exportSettings,
  });
}

export function parseRecipeFormData(formData: FormData) {
  return recipeInputSchema.parse({
    name: formData.get("name"),
    notes: formData.get("notes") ?? "",
    companyFilters: {
      page: 1,
      perPage: 25,
      organizationName: String(formData.get("organizationName") ?? ""),
      organizationWebsite: String(formData.get("organizationWebsite") ?? ""),
      organizationLocations: splitLines(formData.get("organizationLocations")),
      organizationNumEmployeesRanges: splitLines(
        formData.get("organizationNumEmployeesRanges"),
      ),
      organizationIds: splitLines(formData.get("organizationIds")),
      qOrganizationKeywordTags: splitLines(
        formData.get("qOrganizationKeywordTags"),
      ),
      organizationNotKeywordTags: splitLines(
        formData.get("organizationNotKeywordTags"),
      ),
      organizationIndustryTagIds: splitLines(
        formData.get("organizationIndustryTagIds"),
      ),
    },
    peopleFilters: {
      page: 1,
      perPage: 25,
      personTitles: splitLines(formData.get("personTitles")),
      personLocations: splitLines(formData.get("personLocations")),
      personSeniorities: formData.getAll("personSeniorities").map(String),
      personDepartments: formData.getAll("personDepartments").map(String),
    },
    exportSettings: {
      columns: splitLines(formData.get("exportColumns")),
    },
  });
}
