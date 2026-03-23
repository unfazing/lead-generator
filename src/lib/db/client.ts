import { mkdir } from "node:fs/promises";
import path from "node:path";
import { env } from "@/lib/env";

const projectRoot = process.cwd();
const dataDirectory = path.join(projectRoot, "data");

export function getDataDirectoryPath() {
  return dataDirectory;
}

export function getDataFilePath(fileName: string) {
  return path.join(dataDirectory, fileName);
}

export function getRecipeDataFilePath() {
  return env.RECIPE_DATA_FILE
    ? path.resolve(projectRoot, env.RECIPE_DATA_FILE)
    : getDataFilePath("recipes.json");
}

export async function ensureDirectoryForFile(filePath: string) {
  await mkdir(path.dirname(filePath), { recursive: true });
}

export async function ensureDataDirectory() {
  await ensureDirectoryForFile(getRecipeDataFilePath());
}
