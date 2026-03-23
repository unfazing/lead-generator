"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { searchCompanies, createCompanySearchSignature } from "@/lib/apollo/company-search";
import { companySearchPayloadSchema } from "@/lib/company-search/schema";
import { getLatestSnapshotForSignature, saveCompanySnapshot } from "@/lib/db/repositories/company-snapshots";
import { createRecipe, getRecipeById, updateRecipe } from "@/lib/db/repositories/recipes";
import { parseRecipeFormData } from "@/features/recipes/lib/recipe-form";

export async function saveRecipeAction(formData: FormData) {
  const recipeId = formData.get("recipeId");
  const recipeInput = parseRecipeFormData(formData);
  const existingRecipe =
    typeof recipeId === "string" && recipeId
      ? await getRecipeById(recipeId)
      : null;

  const recipe =
    typeof recipeId === "string" && recipeId
      ? await updateRecipe(recipeId, {
          ...recipeInput,
          companyFilters: existingRecipe?.companyFilters ?? recipeInput.companyFilters,
        })
      : await createRecipe(recipeInput);

  revalidatePath("/recipes");
  redirect(`/recipes?recipe=${recipe.id}`);
}

function splitLines(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return [];
  }

  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export async function runCompanySearchAction(formData: FormData) {
  const recipeId = formData.get("recipeId");
  const mode = formData.get("mode") === "latest" ? "latest" : "reuse";

  if (typeof recipeId !== "string" || !recipeId) {
    throw new Error("Recipe is required for company search");
  }

  const payload = companySearchPayloadSchema.parse({
    page: 1,
    perPage: 25,
    organizationName: String(formData.get("organizationName") ?? ""),
    organizationWebsite: String(formData.get("organizationWebsite") ?? ""),
    organizationLocations: splitLines(formData.get("organizationLocations")),
    organizationNumEmployeesRanges: formData
      .getAll("organizationNumEmployeesRanges")
      .map(String),
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
  });

  const recipe = await getRecipeById(recipeId);

  if (!recipe) {
    throw new Error("Recipe not found");
  }

  await updateRecipe(recipeId, {
    name: recipe.name,
    notes: recipe.notes,
    companyFilters: payload,
    peopleFilters: recipe.peopleFilters,
    exportSettings: recipe.exportSettings,
  });

  const signature = createCompanySearchSignature(payload);
  const existing = await getLatestSnapshotForSignature(recipeId, signature);

  if (mode === "reuse" && existing) {
    revalidatePath("/recipes");
    redirect(`/recipes?recipe=${recipeId}&snapshot=${existing.id}`);
  }

  const result = await searchCompanies(payload);
  const snapshot = await saveCompanySnapshot(recipeId, result);

  revalidatePath("/recipes");
  redirect(`/recipes?recipe=${recipeId}&snapshot=${snapshot.id}`);
}
