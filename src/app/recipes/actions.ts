"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { searchCompanies, createCompanySearchSignature } from "@/lib/apollo/company-search";
import { companySearchPayloadSchema } from "@/lib/company-search/schema";
import { getLatestSnapshotForSignature, saveCompanySnapshot } from "@/lib/db/repositories/company-snapshots";
import {
  createCompanyRecipe,
  createPeopleRecipe,
  getRecipeById,
  updateCompanyRecipe,
  updatePeopleRecipe,
} from "@/lib/db/repositories/recipes";
import { parseRecipeFormData } from "@/features/recipes/lib/recipe-form";
import { recipeTypeSchema } from "@/lib/recipes/schema";

export async function saveRecipeAction(formData: FormData) {
  const recipeId = formData.get("recipeId");
  const recipeType = recipeTypeSchema.parse(formData.get("recipeType"));
  const existingRecipe =
    typeof recipeId === "string" && recipeId
      ? await getRecipeById(recipeId)
      : null;
  const pairedCompanyRecipeId = formData.get("pairedCompanyRecipeId");
  const pairedPeopleRecipeId = formData.get("pairedPeopleRecipeId");

  let recipe;
  if (recipeType === "company") {
    const recipeInput = parseRecipeFormData(formData, "company");
    recipe =
      typeof recipeId === "string" && recipeId && existingRecipe?.type === "company"
        ? await updateCompanyRecipe(recipeId, recipeInput)
        : await createCompanyRecipe(recipeInput);
  } else {
    const recipeInput = parseRecipeFormData(formData, "people");
    recipe =
      typeof recipeId === "string" && recipeId && existingRecipe?.type === "people"
        ? await updatePeopleRecipe(recipeId, recipeInput)
        : await createPeopleRecipe(recipeInput);
  }

  revalidatePath("/recipes");
  const companyRecipeId =
    recipe.type === "company"
      ? recipe.id
      : typeof pairedCompanyRecipeId === "string" && pairedCompanyRecipeId
        ? pairedCompanyRecipeId
        : "";
  const peopleRecipeId =
    recipe.type === "people"
      ? recipe.id
      : typeof pairedPeopleRecipeId === "string" && pairedPeopleRecipeId
        ? pairedPeopleRecipeId
        : "";
  const query = new URLSearchParams();

  if (companyRecipeId) {
    query.set("companyRecipe", companyRecipeId);
  }

  if (peopleRecipeId) {
    query.set("peopleRecipe", peopleRecipeId);
  }

  redirect(`/recipes${query.size > 0 ? `?${query.toString()}` : ""}`);
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
  const recipeId = formData.get("companyRecipeId");
  const mode = formData.get("mode") === "latest" ? "latest" : "reuse";
  const pairedPeopleRecipeId = formData.get("peopleRecipeId");

  if (typeof recipeId !== "string" || !recipeId) {
    throw new Error("Company recipe is required for company search");
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

  if (recipe.type !== "company") {
    throw new Error("Selected recipe is not a company recipe");
  }

  await updateCompanyRecipe(recipeId, {
    type: "company",
    name: recipe.name,
    notes: recipe.notes,
    companyFilters: payload,
  });

  const signature = createCompanySearchSignature(payload);
  const existing = await getLatestSnapshotForSignature(recipeId, signature);

  if (mode === "reuse" && existing) {
    revalidatePath("/recipes");
    const query = new URLSearchParams({
      companyRecipe: recipeId,
      snapshot: existing.id,
    });
    if (typeof pairedPeopleRecipeId === "string" && pairedPeopleRecipeId) {
      query.set("peopleRecipe", pairedPeopleRecipeId);
    }
    redirect(`/recipes?${query.toString()}`);
  }

  const result = await searchCompanies(payload);
  const snapshot = await saveCompanySnapshot(recipeId, result);

  revalidatePath("/recipes");
  const query = new URLSearchParams({
    companyRecipe: recipeId,
    snapshot: snapshot.id,
  });
  if (typeof pairedPeopleRecipeId === "string" && pairedPeopleRecipeId) {
    query.set("peopleRecipe", pairedPeopleRecipeId);
  }
  redirect(`/recipes?${query.toString()}`);
}
