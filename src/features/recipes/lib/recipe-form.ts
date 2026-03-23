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
      keywords: [],
      locations: [],
      employeeRanges: [],
    },
    peopleFilters: {
      titles: [],
      seniority: [],
      departments: [],
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
      keywords: splitLines(formData.get("companyKeywords")),
      locations: splitLines(formData.get("companyLocations")),
      employeeRanges: splitLines(formData.get("companyEmployeeRanges")),
    },
    peopleFilters: {
      titles: splitLines(formData.get("peopleTitles")),
      seniority: splitLines(formData.get("peopleSeniority")),
      departments: splitLines(formData.get("peopleDepartments")),
    },
    exportSettings: {
      columns: splitLines(formData.get("exportColumns")),
    },
  });
}
