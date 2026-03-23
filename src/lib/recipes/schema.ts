import { z } from "zod";
import { companySearchPayloadSchema } from "@/lib/company-search/schema";
import { peopleSearchPayloadSchema } from "@/lib/people-search/schema";

const legacyCompanyFiltersSchema = z.object({
  keywords: z.array(z.string().min(1)).default([]),
  locations: z.array(z.string().min(1)).default([]),
  employeeRanges: z.array(z.string().min(1)).default([]),
});

const legacyPeopleFiltersSchema = z.object({
  peopleTitles: z.array(z.string().min(1)).default([]),
  peopleSeniority: z.array(z.string().min(1)).default([]),
  peopleDepartments: z.array(z.string().min(1)).default([]),
});

export const recipeTypeSchema = z.enum(["company", "people"]);

export const companyRecipeSchema = z.object({
  id: z.string().min(1),
  type: z.literal("company"),
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
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const peopleRecipeSchema = z.object({
  id: z.string().min(1),
  type: z.literal("people"),
  name: z.string().min(1).max(120),
  notes: z.string().max(500).default(""),
  peopleFilters: z
    .union([peopleSearchPayloadSchema, legacyPeopleFiltersSchema])
    .transform((value) => {
      if ("personTitles" in value) {
        return peopleSearchPayloadSchema.parse(value);
      }

      return peopleSearchPayloadSchema.parse({
        page: 1,
        perPage: 25,
        personTitles: value.peopleTitles,
        personLocations: [],
        personSeniorities: value.peopleSeniority,
        personDepartments: value.peopleDepartments,
      });
    }),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const recipeSchema = z.discriminatedUnion("type", [
  companyRecipeSchema,
  peopleRecipeSchema,
]);

export const companyRecipeInputSchema = companyRecipeSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const peopleRecipeInputSchema = peopleRecipeSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const recipeInputSchema = z.discriminatedUnion("type", [
  companyRecipeInputSchema,
  peopleRecipeInputSchema,
]);

export type RecipeType = z.infer<typeof recipeTypeSchema>;
export type CompanyRecipe = z.infer<typeof companyRecipeSchema>;
export type PeopleRecipe = z.infer<typeof peopleRecipeSchema>;
export type Recipe = z.infer<typeof recipeSchema>;
export type CompanyRecipeInput = z.infer<typeof companyRecipeInputSchema>;
export type PeopleRecipeInput = z.infer<typeof peopleRecipeInputSchema>;
export type RecipeInput = z.infer<typeof recipeInputSchema>;
