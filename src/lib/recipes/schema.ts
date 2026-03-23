import { z } from "zod";

export const recipeFiltersSchema = z.object({
  companyKeywords: z.array(z.string().min(1)).default([]),
  companyLocations: z.array(z.string().min(1)).default([]),
  companyEmployeeRanges: z.array(z.string().min(1)).default([]),
  peopleTitles: z.array(z.string().min(1)).default([]),
  peopleSeniority: z.array(z.string().min(1)).default([]),
  peopleDepartments: z.array(z.string().min(1)).default([]),
});

export const exportSettingsSchema = z.object({
  columns: z.array(z.string().min(1)).min(1),
});

export const recipeSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(120),
  notes: z.string().max(500).default(""),
  companyFilters: z.object({
    keywords: recipeFiltersSchema.shape.companyKeywords,
    locations: recipeFiltersSchema.shape.companyLocations,
    employeeRanges: recipeFiltersSchema.shape.companyEmployeeRanges,
  }),
  peopleFilters: z.object({
    titles: recipeFiltersSchema.shape.peopleTitles,
    seniority: recipeFiltersSchema.shape.peopleSeniority,
    departments: recipeFiltersSchema.shape.peopleDepartments,
  }),
  exportSettings: exportSettingsSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const recipeInputSchema = recipeSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Recipe = z.infer<typeof recipeSchema>;
export type RecipeInput = z.infer<typeof recipeInputSchema>;
