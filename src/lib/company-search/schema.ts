import { z } from "zod";

export const companySearchPayloadSchema = z.object({
  page: z.number().int().min(1).max(500).default(1),
  perPage: z.number().int().min(1).max(100).default(25),
  organizationName: z.string().trim().max(120).default(""),
  organizationWebsite: z.string().trim().max(120).default(""),
  organizationLocations: z.array(z.string().min(1)).max(10).default([]),
  organizationNumEmployeesRanges: z.array(z.string().min(1)).max(10).default([]),
  organizationIds: z.array(z.string().min(1)).max(25).default([]),
  qOrganizationKeywordTags: z.array(z.string().min(1)).max(15).default([]),
  organizationNotKeywordTags: z.array(z.string().min(1)).max(15).default([]),
  organizationIndustryTagIds: z.array(z.string().min(1)).max(20).default([]),
});

export const companySearchRequestSchema = companySearchPayloadSchema.extend({
  recipeId: z.string().min(1),
  mode: z.enum(["stored", "live"]).default("live"),
});

export type CompanySearchPayload = z.infer<typeof companySearchPayloadSchema>;
export type CompanySearchRequest = z.infer<typeof companySearchRequestSchema>;
