import { z } from "zod";

export const peopleSeniorityOptions = [
  "owner",
  "founder",
  "c_suite",
  "partner",
  "vp",
  "head",
  "director",
  "manager",
  "senior",
  "entry",
  "intern",
] as const;

export const contactEmailStatusOptions = [
  "verified",
  "unverified",
  "likely to engage",
  "unavailable",
] as const;

const optionalInt = z.coerce.number().int().nonnegative().optional();
const optionalDate = z.string().trim().optional();

export const peopleSearchPayloadSchema = z.object({
  page: z.number().int().min(1).max(500).default(1),
  perPage: z.number().int().min(1).max(100).default(25),
  personTitles: z.array(z.string().trim().min(1)).max(25).default([]),
  includeSimilarTitles: z.boolean().default(true),
  qKeywords: z.string().trim().max(250).default(""),
  personLocations: z.array(z.string().trim().min(1)).max(15).default([]),
  personSeniorities: z.array(z.enum(peopleSeniorityOptions)).max(10).default([]),
  organizationLocations: z.array(z.string().trim().min(1)).max(100).default([]),
  qOrganizationDomainsList: z.array(z.string().trim().min(1)).max(1000).default([]),
  contactEmailStatus: z.array(z.enum(contactEmailStatusOptions)).max(10).default([]),
  organizationIds: z.array(z.string().trim().min(1)).max(100).default([]),
  organizationNumEmployeesRanges: z.array(z.string().trim().min(1)).max(20).default([]),
  revenueRangeMin: optionalInt,
  revenueRangeMax: optionalInt,
  currentlyUsingAllOfTechnologyUids: z.array(z.string().trim().min(1)).max(200).default([]),
  currentlyUsingAnyOfTechnologyUids: z.array(z.string().trim().min(1)).max(200).default([]),
  currentlyNotUsingAnyOfTechnologyUids: z.array(z.string().trim().min(1)).max(200).default([]),
  qOrganizationJobTitles: z.array(z.string().trim().min(1)).max(100).default([]),
  organizationJobLocations: z.array(z.string().trim().min(1)).max(100).default([]),
  organizationNumJobsRangeMin: optionalInt,
  organizationNumJobsRangeMax: optionalInt,
  organizationJobPostedAtRangeMin: optionalDate,
  organizationJobPostedAtRangeMax: optionalDate,
});

export const peopleSearchModeSchema = z.enum(["selected", "all"]);

export const peopleSearchRequestSchema = peopleSearchPayloadSchema.extend({
  companyRecipeId: z.string().min(1),
  companySnapshotId: z.string().min(1),
  peopleRecipeId: z.string().min(1),
  mode: peopleSearchModeSchema,
  selectedCompanyIds: z.array(z.string().min(1)).default([]),
});

export type PeopleSearchPayload = z.infer<typeof peopleSearchPayloadSchema>;
export type PeopleSearchMode = z.infer<typeof peopleSearchModeSchema>;
export type PeopleSearchRequest = z.infer<typeof peopleSearchRequestSchema>;
