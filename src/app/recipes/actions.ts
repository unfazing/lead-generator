"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { searchCompanies, createCompanySearchSignature } from "@/lib/apollo/company-search";
import { searchPeople } from "@/lib/apollo/people-search";
import {
  getCompanySnapshotById,
  getLatestSnapshotForSignature,
  saveCompanySnapshot,
} from "@/lib/db/repositories/company-snapshots";
import { savePeopleSnapshot } from "@/lib/db/repositories/people-snapshots";
import {
  markRunPlanReady,
  saveRunPlan,
} from "@/lib/db/repositories/run-plans";
import {
  createCompanyRecipe,
  createPeopleRecipe,
  deleteRecipe,
  getRecipeById,
  applyOrganizationImportsToPeopleRecipe,
  updateCompanyRecipe,
  updatePeopleRecipe,
} from "@/lib/db/repositories/recipes";
import { parseRecipeFormData } from "@/features/recipes/lib/recipe-form";
import { recipeTypeSchema } from "@/lib/recipes/schema";
import { peopleSearchPayloadSchema, peopleSearchModeSchema } from "@/lib/people-search/schema";
import { buildRunPlanEstimate } from "@/features/run-planning/lib/run-plan-estimates";
import { buildSearchWorkspaceQuery } from "@/features/search-workspace/lib/workspace-route-state";

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
  revalidatePath("/search/company");
  revalidatePath("/search/people");
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

export async function deleteRecipeAction(formData: FormData) {
  const recipeId = formData.get("recipeId");
  const recipeType = recipeTypeSchema.parse(formData.get("recipeType"));
  const pairedCompanyRecipeId = formData.get("pairedCompanyRecipeId");
  const pairedPeopleRecipeId = formData.get("pairedPeopleRecipeId");

  if (typeof recipeId !== "string" || !recipeId) {
    throw new Error("Recipe is required");
  }

  await deleteRecipe(recipeId);

  revalidatePath("/recipes/company");
  revalidatePath("/recipes/people");
  revalidatePath("/search");
  revalidatePath("/search/company");
  revalidatePath("/search/people");

  const query = new URLSearchParams();

  if (
    recipeType === "people" &&
    typeof pairedCompanyRecipeId === "string" &&
    pairedCompanyRecipeId
  ) {
    query.set("companyRecipe", pairedCompanyRecipeId);
  }

  if (
    recipeType === "company" &&
    typeof pairedPeopleRecipeId === "string" &&
    pairedPeopleRecipeId
  ) {
    query.set("peopleRecipe", pairedPeopleRecipeId);
  }

  query.set("editorMode", "new");

  redirect(
    `${recipeType === "company" ? "/recipes/company" : "/recipes/people"}${
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
    revalidatePath("/search/company");
    const query = buildSearchWorkspaceQuery({
      workflow: "company",
      companyRecipeId: recipeId,
      companySnapshotId: existing.id,
      peopleRecipeId:
        typeof pairedPeopleRecipeId === "string" && pairedPeopleRecipeId
          ? pairedPeopleRecipeId
          : null,
    });
    redirect(`/search/company?${query}`);
  }

  if (mode === "stored" && !existing) {
    throw new Error(
      "No stored company snapshot exists for this recipe yet. Run a live company search first.",
    );
  }

  const result = await searchCompanies(payload);
  const snapshot = await saveCompanySnapshot(recipeId, result);

  revalidatePath("/search");
  revalidatePath("/search/company");
  const query = buildSearchWorkspaceQuery({
    workflow: "company",
    companyRecipeId: recipeId,
    companySnapshotId: snapshot.id,
    peopleRecipeId:
      typeof pairedPeopleRecipeId === "string" && pairedPeopleRecipeId
        ? pairedPeopleRecipeId
        : null,
  });
  redirect(`/search/company?${query}`);
}

const companyImportPlanEntrySchema = z.object({
  snapshotId: z.string().min(1),
  importMode: peopleSearchModeSchema,
  selectedCompanyIds: z.array(z.string().min(1)).default([]),
});

export async function runPeopleSearchAction(formData: FormData) {
  const peopleRecipeId = formData.get("peopleRecipeId");

  if (typeof peopleRecipeId !== "string" || !peopleRecipeId) {
    throw new Error("People recipe is required");
  }

  const peopleRecipe = await getRecipeById(peopleRecipeId);
  if (!peopleRecipe || peopleRecipe.type !== "people") {
    throw new Error("Selected recipe is not a people recipe");
  }

  if (peopleRecipe.organizationImports.length === 0) {
    throw new Error("Apply one or more company snapshots to the people recipe before running search");
  }

  const payload = peopleSearchPayloadSchema.parse(peopleRecipe.peopleFilters);
  const primaryImport = peopleRecipe.organizationImports[0];
  const sourceSnapshotIds = peopleRecipe.organizationImports.map(
    (entry) => entry.snapshotId,
  );

  const request = {
    ...payload,
    companyRecipeId: primaryImport.companyRecipeId,
    companySnapshotId: primaryImport.snapshotId,
    peopleRecipeId,
    mode: primaryImport.importMode,
    selectedCompanyIds: [],
  };

  const result = await searchPeople(request);
  const snapshot = await savePeopleSnapshot(
    {
      companyRecipeId: primaryImport.companyRecipeId,
      companySnapshotId: primaryImport.snapshotId,
      peopleRecipeId,
      recipeParams: payload,
      selectionMode: primaryImport.importMode,
      selectedCompanyIds: payload.organizationIds,
      organizationImports: peopleRecipe.organizationImports,
    },
    result,
  );

  revalidatePath("/search");
  revalidatePath("/search/people");
  const query = buildSearchWorkspaceQuery({
    workflow: "people",
    peopleRecipeId,
    sourceSnapshotIds,
  });
  redirect(`/search/people/${snapshot.id}?${query}`);
}

export async function applyCompaniesToPeopleRecipeAction(formData: FormData) {
  const peopleRecipeId = formData.get("peopleRecipeId");
  const importPlanRaw = formData.get("importPlan");

  if (typeof peopleRecipeId !== "string" || !peopleRecipeId) {
    throw new Error("People recipe is required");
  }

  if (typeof importPlanRaw !== "string" || !importPlanRaw) {
    throw new Error("Choose at least one company snapshot to import");
  }

  const parsedPlan = z.array(companyImportPlanEntrySchema).parse(JSON.parse(importPlanRaw));

  const imports = await Promise.all(
    parsedPlan.map(async (entry) => {
      const snapshot = await getCompanySnapshotById(entry.snapshotId);

      if (!snapshot) {
        throw new Error("Selected company snapshot was not found");
      }

      const availableCompanyIds = snapshot.result.rows
        .map((row) => row.apollo_id)
        .filter((value) => value && value !== "unknown");

      const organizationIds =
        entry.importMode === "all"
          ? availableCompanyIds
          : availableCompanyIds.filter((companyId) =>
              entry.selectedCompanyIds.includes(companyId),
            );

      if (entry.importMode === "selected" && organizationIds.length === 0) {
        throw new Error(
          "Selected-company imports need at least one company checked in the snapshot table",
        );
      }

      return {
        snapshotId: snapshot.id,
        companyRecipeId: snapshot.recipeId,
        importMode: entry.importMode,
        organizationIds,
        selectedCompanyIds:
          entry.importMode === "selected" ? organizationIds : [],
        importedAt: new Date().toISOString(),
      };
    }),
  );

  const updatedRecipe = await applyOrganizationImportsToPeopleRecipe(
    peopleRecipeId,
    imports,
  );

  revalidatePath("/recipes/people");
  revalidatePath("/search");
  revalidatePath("/search/people");

  const query = buildSearchWorkspaceQuery({
    workflow: "people",
    peopleRecipeId: updatedRecipe.id,
    sourceSnapshotIds: imports.map((entry) => entry.snapshotId),
  });

  redirect(`/search/people?${query}`);
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
