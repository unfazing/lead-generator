import { readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { ZodType } from "zod";
import { ensureDirectoryForFile } from "@/lib/db/client";

export async function readJsonFile<T>(
  filePath: string,
  schema: ZodType<T>,
  fallback: T,
) {
  try {
    const contents = await readFile(filePath, "utf8");
    return schema.parse(JSON.parse(contents));
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      (error as NodeJS.ErrnoException).code === "ENOENT"
    ) {
      return fallback;
    }

    if (error instanceof SyntaxError) {
      return fallback;
    }

    throw error;
  }
}

export async function writeJsonFileAtomically(filePath: string, value: unknown) {
  await ensureDirectoryForFile(filePath);
  const tempPath = path.join(
    path.dirname(filePath),
    `${path.basename(filePath)}.${process.pid}.tmp`,
  );

  await writeFile(tempPath, JSON.stringify(value, null, 2), "utf8");
  await rename(tempPath, filePath);
}
