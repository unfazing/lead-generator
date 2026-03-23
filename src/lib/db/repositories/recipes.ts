import { randomUUID } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { ensureDataDirectory, getRecipeDataFilePath } from "@/lib/db/client";
import {
  companyRecipeInputSchema,
  companyRecipeSchema,
  legacyCombinedRecipeSchema,
  peopleRecipeInputSchema,
  peopleRecipeSchema,
  recipeSchema,
  type CompanyRecipe,
  type CompanyRecipeInput,
  type LegacyCombinedRecipe,
  type PeopleRecipe,
  type PeopleRecipeInput,
  type Recipe,
} from "@/lib/recipes/schema";

const typedRecipeCollectionSchema = recipeSchema.array();
const legacyRecipeCollectionSchema = legacyCombinedRecipeSchema.array();

function splitLegacyRecipe(recipe: LegacyCombinedRecipe): Recipe[] {
  return [
    companyRecipeSchema.parse({
      id: `${recipe.id}:company`,
      type: "company",
      name: `${recipe.name} Company Search`,
      notes: recipe.notes,
      companyFilters: recipe.companyFilters,
      createdAt: recipe.createdAt,
      updatedAt: recipe.updatedAt,
    }),
    peopleRecipeSchema.parse({
      id: `${recipe.id}:people`,
      type: "people",
      name: `${recipe.name} People Search`,
      notes: recipe.notes,
      peopleFilters: recipe.peopleFilters,
      exportSettings: recipe.exportSettings,
      createdAt: recipe.createdAt,
      updatedAt: recipe.updatedAt,
    }),
  ];
}

async function writeRecipes(recipes: Recipe[]) {
  await ensureDataDirectory();
  await writeFile(getRecipeDataFilePath(), JSON.stringify(recipes, null, 2), "utf8");
}

async function readRecipes() {
  const filePath = getRecipeDataFilePath();

  try {
    const contents = await readFile(filePath, "utf8");
    const parsed = JSON.parse(contents) as unknown;

    const typed = typedRecipeCollectionSchema.safeParse(parsed);
    if (typed.success) {
      return typed.data;
    }

    const legacy = legacyRecipeCollectionSchema.safeParse(parsed);
    if (legacy.success) {
      const migrated = legacy.data.flatMap(splitLegacyRecipe);
      await writeRecipes(migrated);
      return migrated;
    }

    throw new Error("Unable to parse recipe data");
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      (error as NodeJS.ErrnoException).code === "ENOENT"
    ) {
      return [];
    }

    throw error;
  }
}

export async function listRecipes() {
  const recipes = await readRecipes();
  return recipes.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function listRecipesByType(type: "company"): Promise<CompanyRecipe[]>;
export async function listRecipesByType(type: "people"): Promise<PeopleRecipe[]>;
export async function listRecipesByType(type: Recipe["type"]) {
  const recipes = await listRecipes();
  return recipes.filter(
    (recipe): recipe is CompanyRecipe | PeopleRecipe => recipe.type === type,
  );
}

export async function getRecipeById(recipeId: string) {
  const recipes = await readRecipes();
  return recipes.find((recipe) => recipe.id === recipeId) ?? null;
}

export async function createCompanyRecipe(input: CompanyRecipeInput) {
  const recipeInput = companyRecipeInputSchema.parse(input);
  const now = new Date().toISOString();
  const recipes = await readRecipes();

  const recipe: CompanyRecipe = companyRecipeSchema.parse({
    ...recipeInput,
    id: randomUUID(),
    type: "company",
    createdAt: now,
    updatedAt: now,
  });

  await writeRecipes([...recipes, recipe]);
  return recipe;
}

export async function createPeopleRecipe(input: PeopleRecipeInput) {
  const recipeInput = peopleRecipeInputSchema.parse(input);
  const now = new Date().toISOString();
  const recipes = await readRecipes();

  const recipe: PeopleRecipe = peopleRecipeSchema.parse({
    ...recipeInput,
    id: randomUUID(),
    type: "people",
    createdAt: now,
    updatedAt: now,
  });

  await writeRecipes([...recipes, recipe]);
  return recipe;
}

export async function updateCompanyRecipe(
  recipeId: string,
  input: CompanyRecipeInput,
) {
  const recipeInput = companyRecipeInputSchema.parse(input);
  const recipes = await readRecipes();
  const existingRecipe = recipes.find((recipe) => recipe.id === recipeId);

  if (!existingRecipe || existingRecipe.type !== "company") {
    throw new Error("Company recipe not found");
  }

  const updatedRecipe = companyRecipeSchema.parse({
    ...existingRecipe,
    ...recipeInput,
    id: recipeId,
    type: "company",
    updatedAt: new Date().toISOString(),
  });

  await writeRecipes(
    recipes.map((recipe) => (recipe.id === recipeId ? updatedRecipe : recipe)),
  );

  return updatedRecipe;
}

export async function updatePeopleRecipe(recipeId: string, input: PeopleRecipeInput) {
  const recipeInput = peopleRecipeInputSchema.parse(input);
  const recipes = await readRecipes();
  const existingRecipe = recipes.find((recipe) => recipe.id === recipeId);

  if (!existingRecipe || existingRecipe.type !== "people") {
    throw new Error("People recipe not found");
  }

  const updatedRecipe = peopleRecipeSchema.parse({
    ...existingRecipe,
    ...recipeInput,
    id: recipeId,
    type: "people",
    updatedAt: new Date().toISOString(),
  });

  await writeRecipes(
    recipes.map((recipe) => (recipe.id === recipeId ? updatedRecipe : recipe)),
  );

  return updatedRecipe;
}
