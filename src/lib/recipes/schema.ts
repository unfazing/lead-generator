import { z } from "zod";
import { companySearchPayloadSchema } from "@/lib/company-search/schema";

const legacyCompanyFiltersSchema = z.object({
  keywords: z.array(z.string().min(1)).default([]),
  locations: z.array(z.string().min(1)).default([]),
  employeeRanges: z.array(z.string().min(1)).default([]),
});

export const recipeFiltersSchema = z.object({
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
  companyFilters: z
    .union([companySearchPayloadSchema, legacyCompanyFiltersSchema])
    .transform((value) => {
      if ("organizationLocations" in value) {
        return companySearchPayloadSchema.parse(value);
      }

      return companySearchPayloadSchema.parse({
        page: 1,
        perPage: 25,
        organizationName: "",
        organizationWebsite: "",
        organizationLocations: value.locations,
        organizationNumEmployeesRanges: value.employeeRanges,
        organizationIds: [],
        qOrganizationKeywordTags: value.keywords,
        organizationNotKeywordTags: [],
        organizationIndustryTagIds: [],
      });
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
