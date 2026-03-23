import { mkdir } from "node:fs/promises";
import path from "node:path";
import { env } from "@/lib/env";

const projectRoot = process.cwd();
const dataDirectory = path.join(projectRoot, "data");

export function getRecipeDataFilePath() {
  return env.RECIPE_DATA_FILE
    ? path.resolve(projectRoot, env.RECIPE_DATA_FILE)
    : path.join(dataDirectory, "recipes.json");
}

export async function ensureDataDirectory() {
  await mkdir(path.dirname(getRecipeDataFilePath()), { recursive: true });
}
