"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { searchCompanies, createCompanySearchSignature } from "@/lib/apollo/company-search";
import { searchPeople } from "@/lib/apollo/people-search";
import { getLatestSnapshotForSignature, saveCompanySnapshot } from "@/lib/db/repositories/company-snapshots";
import { savePeopleSnapshot } from "@/lib/db/repositories/people-snapshots";
import {
  markRunPlanReady,
  saveRunPlan,
} from "@/lib/db/repositories/run-plans";
import {
  createCompanyRecipe,
  createPeopleRecipe,
  getRecipeById,
  updateCompanyRecipe,
  updatePeopleRecipe,
} from "@/lib/db/repositories/recipes";
import { parseRecipeFormData } from "@/features/recipes/lib/recipe-form";
import { recipeTypeSchema } from "@/lib/recipes/schema";
import { peopleSearchPayloadSchema, peopleSearchModeSchema } from "@/lib/people-search/schema";
import { buildRunPlanEstimate } from "@/features/run-planning/lib/run-plan-estimates";

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

  revalidatePath("/recipes/company");
  revalidatePath("/recipes/people");
  revalidatePath("/search");
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

  query.set("editorMode", "edit");

  redirect(
    `${recipe.type === "company" ? "/recipes/company" : "/recipes/people"}${
      query.size > 0 ? `?${query.toString()}` : ""
    }`,
  );
}

export async function runCompanySearchAction(formData: FormData) {
  const recipeId = formData.get("companyRecipeId");
  const mode = formData.get("mode") === "stored" ? "stored" : "live";
  const pairedPeopleRecipeId = formData.get("peopleRecipeId");

  if (typeof recipeId !== "string" || !recipeId) {
    throw new Error("Company recipe is required for company search");
  }

  const recipe = await getRecipeById(recipeId);

  if (!recipe) {
    throw new Error("Recipe not found");
  }

  if (recipe.type !== "company") {
    throw new Error("Selected recipe is not a company recipe");
  }
  const payload = recipe.companyFilters;

  const signature = createCompanySearchSignature(payload);
  const existing = await getLatestSnapshotForSignature(recipeId, signature);

  if (mode === "stored" && existing) {
    revalidatePath("/search");
    const query = new URLSearchParams({
      companyRecipe: recipeId,
      snapshot: existing.id,
    });
    if (typeof pairedPeopleRecipeId === "string" && pairedPeopleRecipeId) {
      query.set("peopleRecipe", pairedPeopleRecipeId);
    }
    redirect(`/search?${query.toString()}`);
  }

  if (mode === "stored" && !existing) {
    throw new Error(
      "No stored company snapshot exists for this recipe yet. Run a live company search first.",
    );
  }

  const result = await searchCompanies(payload);
  const snapshot = await saveCompanySnapshot(recipeId, result);

  revalidatePath("/search");
  const query = new URLSearchParams({
    companyRecipe: recipeId,
    snapshot: snapshot.id,
  });
  if (typeof pairedPeopleRecipeId === "string" && pairedPeopleRecipeId) {
    query.set("peopleRecipe", pairedPeopleRecipeId);
  }
  redirect(`/search?${query.toString()}`);
}

export async function runPeopleSearchAction(formData: FormData) {
  const companyRecipeId = formData.get("companyRecipeId");
  const peopleRecipeId = formData.get("peopleRecipeId");
  const companySnapshotId = formData.get("companySnapshotId");

  if (
    typeof companyRecipeId !== "string" ||
    !companyRecipeId ||
    typeof peopleRecipeId !== "string" ||
    !peopleRecipeId ||
    typeof companySnapshotId !== "string" ||
    !companySnapshotId
  ) {
    throw new Error("Company recipe, people recipe, and company snapshot are required");
  }

  const mode = peopleSearchModeSchema.parse(formData.get("mode"));
  const selectedCompanyIds = formData.getAll("selectedCompanyIds").map(String);

  const peopleRecipe = await getRecipeById(peopleRecipeId);
  if (!peopleRecipe || peopleRecipe.type !== "people") {
    throw new Error("Selected recipe is not a people recipe");
  }

  const payload = peopleSearchPayloadSchema.parse(peopleRecipe.peopleFilters);

  const request = {
    ...payload,
    companyRecipeId,
    companySnapshotId,
    peopleRecipeId,
    mode,
    selectedCompanyIds,
  };

  const result = await searchPeople(request);
  const snapshot = await savePeopleSnapshot(
    {
      companyRecipeId,
      companySnapshotId,
      peopleRecipeId,
      selectionMode: mode,
      selectedCompanyIds,
    },
    result,
  );

  revalidatePath("/search");
  const query = new URLSearchParams({
    companyRecipe: companyRecipeId,
    peopleRecipe: peopleRecipeId,
    snapshot: companySnapshotId,
    peopleSnapshot: snapshot.id,
  });
  redirect(`/search?${query.toString()}`);
}

export async function saveRunPlanAction(formData: FormData) {
  const companyRecipeId = String(formData.get("companyRecipeId") ?? "");
  const companySnapshotId = String(formData.get("companySnapshotId") ?? "");
  const peopleRecipeId = String(formData.get("peopleRecipeId") ?? "");
  const peopleSnapshotId = String(formData.get("peopleSnapshotId") ?? "");
  const maxContacts = Number(formData.get("maxContacts") ?? 0);

  if (
    !companyRecipeId ||
    !companySnapshotId ||
    !peopleRecipeId ||
    !peopleSnapshotId ||
    Number.isNaN(maxContacts) ||
    maxContacts < 1
  ) {
    throw new Error("Run plan requires snapshot context and a positive max contacts cap");
  }

  const peopleSnapshots = await import("@/lib/db/repositories/people-snapshots");
  const snapshotList = await peopleSnapshots.listPeopleSnapshotsForContext(
    peopleRecipeId,
    companySnapshotId,
  );
  const snapshot = snapshotList.find((record) => record.id === peopleSnapshotId);

  if (!snapshot) {
    throw new Error("People snapshot not found");
  }

  const estimate = buildRunPlanEstimate(snapshot, maxContacts);
  await saveRunPlan({
    companyRecipeId,
    peopleRecipeId,
    companySnapshotId,
    peopleSnapshotId,
    maxContacts,
    estimatedContacts: estimate.estimatedContacts,
    estimateSummary: estimate.estimateSummary,
    estimateNote: estimate.estimateNote,
  });

  revalidatePath("/search");
  redirect(
    `/search?${new URLSearchParams({
      companyRecipe: companyRecipeId,
      peopleRecipe: peopleRecipeId,
      snapshot: companySnapshotId,
      peopleSnapshot: peopleSnapshotId,
    }).toString()}`,
  );
}

export async function confirmRunPlanAction(formData: FormData) {
  const runPlanId = String(formData.get("runPlanId") ?? "");
  if (!runPlanId) {
    throw new Error("Run plan is required");
  }

  const plan = await markRunPlanReady(runPlanId);
  revalidatePath("/search");
  redirect(
    `/search?${new URLSearchParams({
      companyRecipe: plan.companyRecipeId,
      peopleRecipe: plan.peopleRecipeId,
      snapshot: plan.companySnapshotId,
      peopleSnapshot: plan.peopleSnapshotId,
    }).toString()}`,
  );
}
