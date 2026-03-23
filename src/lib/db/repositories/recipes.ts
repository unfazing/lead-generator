import { randomUUID } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { ensureDataDirectory, getRecipeDataFilePath } from "@/lib/db/client";
import {
  recipeInputSchema,
  recipeSchema,
  type Recipe,
  type RecipeInput,
} from "@/lib/recipes/schema";

const recipeCollectionSchema = recipeSchema.array();

async function readRecipes() {
  const filePath = getRecipeDataFilePath();

  try {
    const contents = await readFile(filePath, "utf8");
    const parsed = JSON.parse(contents) as unknown;
    return recipeCollectionSchema.parse(parsed);
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

async function writeRecipes(recipes: Recipe[]) {
  await ensureDataDirectory();
  await writeFile(
    getRecipeDataFilePath(),
    JSON.stringify(recipes, null, 2),
    "utf8",
  );
}

export async function listRecipes() {
  const recipes = await readRecipes();
  return recipes.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getRecipeById(recipeId: string) {
  const recipes = await readRecipes();
  return recipes.find((recipe) => recipe.id === recipeId) ?? null;
}

export async function createRecipe(input: RecipeInput) {
  const recipeInput = recipeInputSchema.parse(input);
  const now = new Date().toISOString();
  const recipes = await readRecipes();

  const recipe: Recipe = recipeSchema.parse({
    ...recipeInput,
    id: randomUUID(),
    createdAt: now,
    updatedAt: now,
  });

  await writeRecipes([...recipes, recipe]);

  return recipe;
}

export async function updateRecipe(recipeId: string, input: RecipeInput) {
  const recipeInput = recipeInputSchema.parse(input);
  const recipes = await readRecipes();
  const existingRecipe = recipes.find((recipe) => recipe.id === recipeId);

  if (!existingRecipe) {
    throw new Error("Recipe not found");
  }

  const updatedRecipe = recipeSchema.parse({
    ...existingRecipe,
    ...recipeInput,
    id: recipeId,
    updatedAt: new Date().toISOString(),
  });

  await writeRecipes(
    recipes.map((recipe) => (recipe.id === recipeId ? updatedRecipe : recipe)),
  );

  return updatedRecipe;
}
