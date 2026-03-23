import { z } from "zod";

const optionalInt = z.coerce.number().int().nonnegative().optional();
const optionalDate = z.string().trim().optional();

export const companySearchPayloadSchema = z.object({
  page: z.number().int().min(1).max(500).default(1),
  perPage: z.number().int().min(1).max(100).default(25),
  organizationName: z.string().trim().max(120).default(""),
  organizationWebsite: z.string().trim().max(120).default(""),
  qOrganizationDomainsList: z.array(z.string().min(1)).max(1000).default([]),
  organizationLocations: z.array(z.string().min(1)).max(10).default([]),
  organizationNotLocations: z.array(z.string().min(1)).max(100).default([]),
  organizationNumEmployeesRanges: z.array(z.string().min(1)).max(10).default([]),
  organizationIds: z.array(z.string().min(1)).max(25).default([]),
  currentlyUsingAnyOfTechnologyUids: z.array(z.string().min(1)).max(200).default([]),
  qOrganizationKeywordTags: z.array(z.string().min(1)).max(15).default([]),
  qOrganizationJobTitles: z.array(z.string().min(1)).max(100).default([]),
  organizationJobLocations: z.array(z.string().min(1)).max(100).default([]),
  organizationNotKeywordTags: z.array(z.string().min(1)).max(50).default([]),
  organizationIndustryTagIds: z.array(z.string().min(1)).max(20).default([]),
  revenueRangeMin: optionalInt,
  revenueRangeMax: optionalInt,
  latestFundingAmountRangeMin: optionalInt,
  latestFundingAmountRangeMax: optionalInt,
  totalFundingRangeMin: optionalInt,
  totalFundingRangeMax: optionalInt,
  organizationNumJobsRangeMin: optionalInt,
  organizationNumJobsRangeMax: optionalInt,
  latestFundingDateRangeMin: optionalDate,
  latestFundingDateRangeMax: optionalDate,
  organizationJobPostedAtRangeMin: optionalDate,
  organizationJobPostedAtRangeMax: optionalDate,
});

export const companySearchRequestSchema = companySearchPayloadSchema.extend({
  recipeId: z.string().min(1),
  mode: z.enum(["stored", "live"]).default("live"),
});

export type CompanySearchPayload = z.infer<typeof companySearchPayloadSchema>;
export type CompanySearchRequest = z.infer<typeof companySearchRequestSchema>;
