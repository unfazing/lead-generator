import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  APOLLO_API_KEY: z.string().min(1).optional(),
  DATABASE_URL: z.string().min(1).optional(),
  RECIPE_DATA_FILE: z.string().min(1).optional(),
});

const parsed = envSchema.safeParse({
  NODE_ENV: process.env.NODE_ENV,
  APOLLO_API_KEY: process.env.APOLLO_API_KEY,
  DATABASE_URL: process.env.DATABASE_URL,
  RECIPE_DATA_FILE: process.env.RECIPE_DATA_FILE,
});

if (!parsed.success) {
  throw new Error(
    `Invalid environment configuration: ${parsed.error.issues
      .map((issue) => issue.path.join("."))
      .join(", ")}`,
  );
}

export const env = parsed.data;
