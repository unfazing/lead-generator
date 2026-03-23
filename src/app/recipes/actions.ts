"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createRecipe, updateRecipe } from "@/lib/db/repositories/recipes";
import { parseRecipeFormData } from "@/features/recipes/lib/recipe-form";

export async function saveRecipeAction(formData: FormData) {
  const recipeId = formData.get("recipeId");
  const recipeInput = parseRecipeFormData(formData);

  const recipe =
    typeof recipeId === "string" && recipeId
      ? await updateRecipe(recipeId, recipeInput)
      : await createRecipe(recipeInput);

  revalidatePath("/recipes");
  redirect(`/recipes?recipe=${recipe.id}`);
}
